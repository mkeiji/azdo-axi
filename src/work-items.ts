import type { CommandRunner } from "./az.js";
import type { AzureDevOpsContext } from "./context.js";
import { AzdoAxiError } from "./errors.js";

export interface WorkItemReadOptions {
  assignee?: string;
  iteration?: string;
  area?: string;
  full?: boolean;
}

export interface WorkItemScope {
  organization: string;
  project: string;
  team?: string;
  state: string;
  type: string;
  assignee?: string;
  iteration?: string;
  area?: string;
}

export interface WorkItemListResult extends Record<string, unknown> {
  context: AzureDevOpsContext;
  scope: WorkItemScope;
  count: number;
  items: Array<Record<string, unknown>>;
}

export interface QueryResult extends Record<string, unknown> {
  context: AzureDevOpsContext;
  scope: { organization: string; project: string; team?: string; wiql: string };
  count: number;
  items: Array<Record<string, unknown>>;
}

export interface WorkItemLinksResult extends Record<string, unknown> {
  context: AzureDevOpsContext;
  scope: { organization: string; project: string; team?: string };
  workItemId: string;
  count: number;
  links: Array<Record<string, unknown>>;
  item?: Record<string, unknown>;
}

const DEFAULT_TEXT_LIMIT = 2_000;
const DEFAULT_HISTORY_LIMIT = 20;
const FIELDS = {
  type: "System.WorkItemType",
  title: "System.Title",
  state: "System.State",
  assignee: "System.AssignedTo",
  description: "System.Description",
  acceptanceCriteria: "Microsoft.VSTS.Common.AcceptanceCriteria",
  area: "System.AreaPath",
  iteration: "System.IterationPath",
  tags: "System.Tags",
  effort: "Microsoft.VSTS.Scheduling.Effort",
  storyPoints: "Microsoft.VSTS.Scheduling.StoryPoints",
  originalEstimate: "Microsoft.VSTS.Scheduling.OriginalEstimate",
  remainingWork: "Microsoft.VSTS.Scheduling.RemainingWork",
  completedWork: "Microsoft.VSTS.Scheduling.CompletedWork",
  history: "System.History",
} as const;

export async function listWorkItems(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  options: WorkItemReadOptions,
): Promise<WorkItemListResult> {
  const assignee = options.assignee;
  const iteration = options.iteration ?? context.iteration;
  const area = options.area;
  const scope: WorkItemScope = {
    organization: context.organization,
    project: context.project,
    ...(context.team ? { team: context.team } : {}),
    state: "Active",
    type: "Task",
    ...(assignee ? { assignee } : {}),
    ...(iteration ? { iteration } : {}),
    ...(area ? { area } : {}),
  };
  const args = [
    "boards",
    "query",
    "--wiql",
    buildListWiql({ assignee, iteration, area }),
    "--organization",
    context.organization,
    "--project",
    context.project,
    "--output",
    "json",
    "--only-show-errors",
  ];

  const raw = await runAzureJson(runner, args, "work-item list");
  if (!Array.isArray(raw)) {
    throw invalidOutput(
      "work-item list returned an object instead of an array",
    );
  }
  const items = raw.map((item) => listItem(item));
  return { context, scope, count: items.length, items };
}

export async function queryWorkItems(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  wiql: string,
): Promise<QueryResult> {
  const args = [
    "boards",
    "query",
    "--wiql",
    wiql,
    "--organization",
    context.organization,
    "--project",
    context.project,
    "--output",
    "json",
    "--only-show-errors",
  ];
  const raw = await runAzureJson(runner, args, "query");
  if (!Array.isArray(raw)) {
    throw invalidOutput("query returned an object instead of an array");
  }
  const items = raw.map((item) => queryItem(item));
  return {
    context,
    scope: {
      organization: context.organization,
      project: context.project,
      ...(context.team ? { team: context.team } : {}),
      wiql,
    },
    count: items.length,
    items,
  };
}

export async function showWorkItem(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  id: string,
  options: Pick<WorkItemReadOptions, "full">,
): Promise<Record<string, unknown>> {
  const args = [
    "boards",
    "work-item",
    "show",
    "--id",
    id,
    "--organization",
    context.organization,
    "--project",
    context.project,
    "--expand",
    "relations",
    "--output",
    "json",
    "--only-show-errors",
  ];
  const raw = await runAzureJson(runner, args, `work-item show ${id}`);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw invalidOutput("work-item show returned an invalid object");
  }
  return {
    context,
    item: detailItem(raw as Record<string, unknown>, Boolean(options.full)),
  };
}

export async function linkWorkItem(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  id: string,
): Promise<WorkItemLinksResult> {
  const args = [
    "boards",
    "work-item",
    "show",
    "--id",
    id,
    "--organization",
    context.organization,
    "--project",
    context.project,
    "--expand",
    "relations",
    "--output",
    "json",
    "--only-show-errors",
  ];
  const raw = await runAzureJson(runner, args, `work-item links ${id}`);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw invalidOutput("work-item links returned an invalid object");
  }
  const item = raw as Record<string, unknown>;
  const links = linkRelations(item.relations);
  const fields = asRecord(item.fields);
  return {
    context,
    scope: {
      organization: context.organization,
      project: context.project,
      ...(context.team ? { team: context.team } : {}),
    },
    workItemId: id,
    count: links.length,
    links,
    item: compact({
      id: item.id ?? id,
      type: fields[FIELDS.type],
      title: fields[FIELDS.title],
      fields: Object.keys(fields).length > 0 ? fields : undefined,
    }),
  };
}

export function buildListWiql(options: WorkItemReadOptions = {}): string {
  const predicates = [
    "[System.TeamProject] = @project",
    "[System.WorkItemType] = 'Task'",
    "[System.State] = 'Active'",
  ];
  if (options.assignee) {
    predicates.push(
      `[System.AssignedTo] = '${escapeWiqlLiteral(options.assignee)}'`,
    );
  }
  if (options.iteration) {
    predicates.push(
      `[System.IterationPath] = '${escapeWiqlLiteral(options.iteration)}'`,
    );
  }
  if (options.area) {
    predicates.push(`[System.AreaPath] = '${escapeWiqlLiteral(options.area)}'`);
  }
  return [
    "SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State], [System.AssignedTo]",
    "FROM WorkItems",
    `WHERE ${predicates.join(" AND ")}`,
    "ORDER BY [System.Id]",
  ].join(" ");
}

function escapeWiqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

export function queryItem(value: unknown): Record<string, unknown> {
  const item = asRecord(value);
  const fields = asRecord(item.fields);
  return compact({
    id: item.id,
    url: item.url,
    type: fields[FIELDS.type],
    title: fields[FIELDS.title],
    state: fields[FIELDS.state],
    assignee: personName(fields[FIELDS.assignee]),
    fields: Object.keys(fields).length > 0 ? fields : undefined,
  });
}

export function listItem(value: unknown): Record<string, unknown> {
  const item = asRecord(value);
  const fields = asRecord(item.fields);
  return compact({
    id: item.id,
    type: fields[FIELDS.type],
    title: fields[FIELDS.title],
    state: fields[FIELDS.state],
    assignee: personName(fields[FIELDS.assignee]),
  });
}

export function detailItem(
  item: Record<string, unknown>,
  full = false,
): Record<string, unknown> {
  const fields = asRecord(item.fields);
  const result: Record<string, unknown> = compact({
    id: item.id,
    type: fields[FIELDS.type],
    title: fields[FIELDS.title],
    state: fields[FIELDS.state],
    assignee: personName(fields[FIELDS.assignee]),
    area: fields[FIELDS.area],
    iteration: fields[FIELDS.iteration],
    tags: splitTags(fields[FIELDS.tags]),
    estimates: compact({
      effort: fields[FIELDS.effort],
      storyPoints: fields[FIELDS.storyPoints],
      originalEstimate: fields[FIELDS.originalEstimate],
      remainingWork: fields[FIELDS.remainingWork],
      completedWork: fields[FIELDS.completedWork],
    }),
    relationships: relations(item.relations),
  });

  addBoundedText(result, "description", fields[FIELDS.description], full);
  addBoundedText(
    result,
    "acceptanceCriteria",
    fields[FIELDS.acceptanceCriteria],
    full,
  );
  addBoundedHistory(result, fields[FIELDS.history], full);
  return result;
}

function addBoundedText(
  result: Record<string, unknown>,
  key: string,
  value: unknown,
  full: boolean,
): void {
  if (typeof value !== "string" || value.length === 0) return;
  const bounded = full ? value : value.slice(0, DEFAULT_TEXT_LIMIT);
  result[key] = bounded;
  if (value.length > bounded.length) {
    result[`${key}OriginalSize`] = value.length;
    result[`${key}Truncated`] = true;
  }
}

function addBoundedHistory(
  result: Record<string, unknown>,
  value: unknown,
  full: boolean,
): void {
  if (value === undefined || value === null || value === "") return;
  if (typeof value === "string") {
    addBoundedText(result, "history", value, full);
    return;
  }
  if (!Array.isArray(value)) return;
  const entries = full ? value : value.slice(0, DEFAULT_HISTORY_LIMIT);
  result.history = entries;
  if (entries.length < value.length) {
    result.historyOriginalSize = value.length;
    result.historyTruncated = true;
  }
}

function relations(value: unknown): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((relation) => {
    const record = asRecord(relation);
    return compact({
      type: record.rel,
      url: record.url,
      attributes: record.attributes,
    });
  });
}

export function linkRelations(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.map((relation) => {
    const record = asRecord(relation);
    const type = typeof record.rel === "string" ? record.rel : undefined;
    const category = linkCategory(type);
    const targetId = targetIdFromUrl(record.url);
    return compact({
      category,
      type,
      targetId,
      id: targetId,
      url: record.url,
      attributes: record.attributes,
    });
  });
}

function linkCategory(type: string | undefined): string {
  if (type === "System.LinkTypes.Hierarchy-Reverse") return "parent";
  if (type === "System.LinkTypes.Hierarchy-Forward") return "child";
  if (type === "System.LinkTypes.Related") return "related";
  return "other";
}

function targetIdFromUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/workItems\/(\d+)(?:$|[/?#])/i);
  return match?.[1];
}

function personName(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const person = value as Record<string, unknown>;
    for (const key of ["displayName", "uniqueName", "id"]) {
      if (typeof person[key] === "string") return person[key];
    }
  }
  return undefined;
}

function splitTags(value: unknown): string[] | undefined {
  if (typeof value !== "string") return undefined;
  const tags = value
    .split(";")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

async function runAzureJson(
  runner: CommandRunner,
  args: string[],
  operation: string,
): Promise<unknown> {
  let output: string;
  try {
    output = await runner.run(args);
  } catch (error) {
    throw normalizeAzureError(error, operation);
  }
  try {
    return JSON.parse(output);
  } catch {
    throw invalidOutput(`${operation} did not return JSON output`);
  }
}

export function normalizeAzureError(
  error: unknown,
  operation: string,
): AzdoAxiError {
  const record =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const text = [
    error instanceof Error ? error.message : String(error),
    record.stderr,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  if (/unauthorized|authentication|login|401/.test(text)) {
    return new AzdoAxiError(
      `Azure DevOps authentication failed for ${operation}.`,
      "AZ_AUTHENTICATION_FAILED",
      ["Run `az login` and verify access to the selected organization."],
    );
  }
  if (/forbidden|permission|403|not authorized/.test(text)) {
    return new AzdoAxiError(
      `Azure DevOps denied access to ${operation}.`,
      "AZ_PERMISSION_DENIED",
      ["Verify your account can read this project and work item."],
    );
  }
  if (/not found|does not exist|404/.test(text)) {
    return new AzdoAxiError(
      `Azure DevOps ${operation} resource was not found.`,
      /work-item (show|links)/.test(operation)
        ? "WORK_ITEM_NOT_FOUND"
        : "AZ_RESOURCE_NOT_FOUND",
      ["Check the work-item ID and resolved organization/project context."],
    );
  }
  return new AzdoAxiError(
    `Azure DevOps ${operation} request failed.`,
    "AZ_BOARDS_REQUEST_FAILED",
    [
      "Run `az devops configure --list` and verify the organization/project context.",
    ],
  );
}

function invalidOutput(message: string): AzdoAxiError {
  return new AzdoAxiError(message, "AZ_CLI_INVALID_OUTPUT", [
    "Update Azure CLI and the azure-devops extension, then retry.",
  ]);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined && item !== null,
    ),
  );
}
