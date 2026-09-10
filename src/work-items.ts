import { stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import {
  MAX_BUFFERED_ATTACHMENT_SIZE,
  type CommandRunner,
} from "./az.js";
import type { AzureDevOpsContext } from "./context.js";
import { isValidFieldReferenceName } from "./field-validation.js";
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

export interface WorkItemCommentsResult extends Record<string, unknown> {
  context: AzureDevOpsContext;
  organization: string;
  project: string;
  workItemId: string;
  count: number;
  comments: Array<Record<string, unknown>>;
  continuationToken?: string;
}

export interface WorkItemAttachmentsResult extends Record<string, unknown> {
  context: AzureDevOpsContext;
  organization: string;
  project: string;
  workItemId: string;
  count: number;
  attachments: Array<Record<string, unknown>>;
  truncated?: boolean;
}

export interface WorkItemAttachmentDownloadResult extends Record<
  string,
  unknown
> {
  context: AzureDevOpsContext;
  organization: string;
  project: string;
  workItemId: string;
  attachmentId: string;
  path: string;
  size: number;
  contentType?: string;
}

export interface WorkItemMutationOptions {
  workItemType?: string;
  title?: string;
  description?: string;
  parent?: string;
  iteration?: string;
  assignee?: string;
  area?: string;
  state?: string;
  tags?: string;
  fields?: Record<string, string>;
}

export interface WorkItemMutationResult extends Record<string, unknown> {
  context: AzureDevOpsContext;
  organization: string;
  project: string;
  operation: "create" | "update";
  workItemId: string | number;
  noOp: boolean;
  type?: string;
  title?: string;
  state?: string;
  item: Record<string, unknown>;
}

const DEFAULT_TEXT_LIMIT = 2_000;
const DEFAULT_HISTORY_LIMIT = 20;
const DEFAULT_COMMENT_PAGE_SIZE = 50;
const DEFAULT_ATTACHMENT_LIMIT = 100;
const MAX_EVIDENCE_LIMIT = 200;
const MAX_COMMENT_PAGES = 1_000;
const FIELDS = {
  type: "System.WorkItemType",
  title: "System.Title",
  state: "System.State",
  assignee: "System.AssignedTo",
  description: "System.Description",
  acceptanceCriteria: "Microsoft.VSTS.Common.AcceptanceCriteria",
  area: "System.AreaPath",
  iteration: "System.IterationPath",
  parent: "System.Parent",
  tags: "System.Tags",
  effort: "Microsoft.VSTS.Scheduling.Effort",
  storyPoints: "Microsoft.VSTS.Scheduling.StoryPoints",
  originalEstimate: "Microsoft.VSTS.Scheduling.OriginalEstimate",
  remainingWork: "Microsoft.VSTS.Scheduling.RemainingWork",
  completedWork: "Microsoft.VSTS.Scheduling.CompletedWork",
  history: "System.History",
} as const;

const NATIVE_UPDATE_FLAGS: Record<string, string> = {
  [FIELDS.title]: "--title",
  [FIELDS.description]: "--description",
  [FIELDS.state]: "--state",
  [FIELDS.assignee]: "--assigned-to",
  [FIELDS.area]: "--area",
  [FIELDS.iteration]: "--iteration",
};

export function buildCreateWorkItemArgs(
  context: AzureDevOpsContext,
  options: WorkItemMutationOptions,
): string[] {
  if (!options.workItemType) {
    throw new AzdoAxiError("A work-item type is required.", "VALIDATION_ERROR");
  }
  if (!options.title) {
    throw new AzdoAxiError(
      "A work-item title is required.",
      "VALIDATION_ERROR",
    );
  }
  if (options.parent !== undefined) validateParentId(options.parent);
  assertReservedCreateFields(options.fields);
  const fields = mutationFields(options, true);
  if (options.parent !== undefined) delete fields[FIELDS.parent];
  return [
    "boards",
    "work-item",
    "create",
    "--type",
    options.workItemType,
    "--title",
    options.title,
    ...fieldArgs(fields),
    "--organization",
    context.organization,
    "--project",
    context.project,
    "--output",
    "json",
    "--only-show-errors",
  ];
}

export function buildUpdateWorkItemArgs(
  context: AzureDevOpsContext,
  id: string,
  fields: Record<string, string>,
): string[] {
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    throw new AzdoAxiError(
      "A work-item ID must be a positive integer.",
      "VALIDATION_ERROR",
    );
  }
  if (Object.keys(fields).length === 0) {
    throw new AzdoAxiError(
      "At least one update field is required.",
      "VALIDATION_ERROR",
    );
  }
  const nativeArgs: string[] = [];
  const customFields: Record<string, string> = {};
  for (const [name, value] of Object.entries(fields)) {
    const flag = NATIVE_UPDATE_FLAGS[name];
    if (flag) {
      nativeArgs.push(flag, value);
    } else {
      customFields[name] = value;
    }
  }
  return [
    "boards",
    "work-item",
    "update",
    "--id",
    id,
    ...nativeArgs,
    ...fieldArgs(customFields),
    "--organization",
    context.organization,
    "--output",
    "json",
    "--only-show-errors",
  ];
}

export async function createWorkItem(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  options: WorkItemMutationOptions,
): Promise<WorkItemMutationResult> {
  const raw = await runAzureJson(
    runner,
    buildCreateWorkItemArgs(context, options),
    "work-item create",
  );
  assertMutationObject(raw, "work-item create");
  if (options.parent === undefined) {
    return mutationResult(context, "create", raw, false);
  }

  const childId = createdWorkItemId(raw);
  await runAzure(
    runner,
    buildParentRelationArgs(context, childId, options.parent),
    `work-item relation add ${childId}`,
  );
  const verified = await readRawWorkItem(
    runner,
    context,
    childId,
    `work-item show ${childId} for parent verification`,
    false,
  );
  if (!hasParentRelation(verified, options.parent)) {
    throw new AzdoAxiError(
      `Azure DevOps did not persist parent ${options.parent} for created work item ${childId}.`,
      "AZ_PARENT_RELATION_UNVERIFIED",
      [
        "Inspect the created work item's relationships and verify the parent work-item ID.",
      ],
    );
  }
  return mutationResult(context, "create", verified, false, childId);
}

export function buildParentRelationArgs(
  context: AzureDevOpsContext,
  childId: string,
  parentId: string,
): string[] {
  validateWorkItemId(childId, "Created work-item ID");
  validateParentId(parentId);
  return [
    "boards",
    "work-item",
    "relation",
    "add",
    "--id",
    childId,
    "--relation-type",
    "parent",
    "--target-id",
    parentId,
    "--organization",
    context.organization,
    "--output",
    "json",
    "--only-show-errors",
  ];
}

export async function updateWorkItem(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  id: string,
  options: WorkItemMutationOptions,
): Promise<WorkItemMutationResult> {
  validateWorkItemId(id);
  const requested = mutationFields(options, false);
  if (Object.keys(requested).length === 0) {
    throw new AzdoAxiError(
      "At least one update field is required.",
      "VALIDATION_ERROR",
    );
  }
  const current = await readRawWorkItem(
    runner,
    context,
    id,
    "work-item update",
    false,
  );
  const fields = changedMutationFields(current, requested);
  if (Object.keys(fields).length === 0) {
    return mutationResult(context, "update", current, true, id);
  }
  const raw = await runAzureJson(
    runner,
    buildUpdateWorkItemArgs(context, id, fields),
    `work-item update ${id}`,
  );
  assertMutationObject(raw, `work-item update ${id}`);
  return mutationResult(context, "update", raw, false, id);
}

function assertReservedCreateFields(
  fields: Record<string, string> | undefined,
): void {
  for (const name of [FIELDS.type, FIELDS.title]) {
    if (fields && Object.hasOwn(fields, name)) {
      throw new AzdoAxiError(
        `Field ${name} cannot be combined with the create type or title option.`,
        "VALIDATION_ERROR",
      );
    }
  }
}

function mutationFields(
  options: WorkItemMutationOptions,
  creating: boolean,
): Record<string, string> {
  const fields: Record<string, string> = { ...(options.fields ?? {}) };
  const standard: Record<string, string | undefined> = {
    ...(creating ? {} : { [FIELDS.title]: options.title }),
    [FIELDS.description]: options.description,
    [FIELDS.parent]: options.parent,
    [FIELDS.iteration]: options.iteration,
    [FIELDS.assignee]: options.assignee,
    [FIELDS.area]: options.area,
    [FIELDS.state]: options.state,
    [FIELDS.tags]: options.tags,
  };
  for (const [name, value] of Object.entries(standard)) {
    if (value === undefined) continue;
    if (Object.hasOwn(fields, name)) {
      throw new AzdoAxiError(
        `Field ${name} was provided both as a standard option and a custom field.`,
        "VALIDATION_ERROR",
      );
    }
    fields[name] = value;
  }
  return fields;
}

function changedMutationFields(
  current: Record<string, unknown>,
  requested: Record<string, string>,
): Record<string, string> {
  const currentFields = asRecord(current.fields);
  return Object.fromEntries(
    Object.entries(requested).filter(([name, desired]) => {
      const actual = currentFields[name];
      if (name === FIELDS.tags) {
        return !sameTags(actual, desired);
      }
      if (name === FIELDS.assignee) {
        return personName(actual) !== desired;
      }
      return String(actual ?? "") !== desired;
    }),
  );
}

function sameTags(actual: unknown, desired: string): boolean {
  const normalize = (value: unknown): string[] =>
    String(value ?? "")
      .split(";")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .sort();
  return (
    JSON.stringify(normalize(actual)) === JSON.stringify(normalize(desired))
  );
}

function fieldArgs(fields: Record<string, string>): string[] {
  for (const name of Object.keys(fields)) {
    if (!isValidFieldReferenceName(name)) {
      throw new AzdoAxiError(
        `Field ${name || "<empty>"} is not a valid Azure DevOps reference name.`,
        "VALIDATION_ERROR",
      );
    }
  }
  const entries = Object.entries(fields).map(
    ([name, value]) => `${name}=${value}`,
  );
  return entries.length > 0 ? ["--fields", ...entries] : [];
}

function validateParentId(id: string): void {
  validateWorkItemId(id, "Parent work-item ID");
}

function validateWorkItemId(id: string, label = "Work-item ID"): void {
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    throw new AzdoAxiError(
      `${label} must be a positive integer.`,
      "VALIDATION_ERROR",
    );
  }
}

function createdWorkItemId(raw: Record<string, unknown>): string {
  const id = raw.id;
  const value =
    typeof id === "number" && Number.isInteger(id) ? String(id) : id;
  if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) <= 0) {
    throw invalidOutput("work-item create did not return a valid work-item ID");
  }
  return value;
}

function hasParentRelation(
  item: Record<string, unknown>,
  parentId: string,
): boolean {
  const fields = asRecord(item.fields);
  if (String(fields[FIELDS.parent] ?? "") === parentId) return true;
  if (!Array.isArray(item.relations)) return false;
  return item.relations.some((relation) => {
    const record = asRecord(relation);
    return (
      record.rel === "System.LinkTypes.Hierarchy-Reverse" &&
      targetIdFromUrl(record.url) === parentId
    );
  });
}

async function readRawWorkItem(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  id: string,
  operation: string,
  includeProject = true,
): Promise<Record<string, unknown>> {
  const raw = await runAzureJson(
    runner,
    [
      "boards",
      "work-item",
      "show",
      "--id",
      id,
      "--organization",
      context.organization,
      ...(includeProject ? ["--project", context.project] : []),
      "--expand",
      "relations",
      "--output",
      "json",
      "--only-show-errors",
    ],
    operation,
  );
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw invalidOutput(`${operation} returned an invalid object`);
  }
  return raw as Record<string, unknown>;
}

function assertMutationObject(
  raw: unknown,
  operation: string,
): asserts raw is Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw invalidOutput(`${operation} returned an invalid object`);
  }
}

function mutationResult(
  context: AzureDevOpsContext,
  operation: "create" | "update",
  raw: unknown,
  noOp: boolean,
  fallbackId?: string,
): WorkItemMutationResult {
  const item = asRecord(raw);
  const fields = asRecord(item.fields);
  const workItemId = item.id ?? fallbackId ?? "unknown";
  const detail = detailItem(item, false);
  if (Object.keys(fields).length > 0) detail.fields = fields;
  const type: string | undefined =
    typeof fields[FIELDS.type] === "string"
      ? String(fields[FIELDS.type])
      : undefined;
  const title: string | undefined =
    typeof fields[FIELDS.title] === "string"
      ? String(fields[FIELDS.title])
      : undefined;
  const state: string | undefined =
    typeof fields[FIELDS.state] === "string"
      ? String(fields[FIELDS.state])
      : undefined;
  return {
    context,
    organization: context.organization,
    project: context.project,
    operation,
    workItemId: workItemId as string | number,
    noOp,
    ...(type ? { type } : {}),
    ...(title ? { title } : {}),
    ...(state ? { state } : {}),
    item: detail,
  };
}

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
  const raw = await readRawWorkItem(
    runner,
    context,
    id,
    `work-item show ${id}`,
    false,
  );
  return {
    context,
    item: detailItem(raw, Boolean(options.full)),
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

export async function listWorkItemComments(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  id: string,
  options: Pick<WorkItemReadOptions, "full"> & {
    top?: number;
    continuationToken?: string;
    all?: boolean;
  },
): Promise<WorkItemCommentsResult> {
  validateWorkItemId(id);
  const top = options.top ?? DEFAULT_COMMENT_PAGE_SIZE;
  const comments: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  let continuationToken = options.continuationToken;
  let pageCount = 0;

  do {
    if (pageCount++ >= MAX_COMMENT_PAGES) {
      throw new AzdoAxiError(
        "Azure DevOps comment pagination exceeded the safe page limit.",
        "AZ_COMMENTS_PAGINATION_LIMIT",
        ["Use --continuation-token to resume from a smaller bounded page."],
      );
    }
    const raw = await runAzureJson(
      runner,
      buildCommentsArgs(context, id, top, continuationToken),
      `work-item comments ${id}`,
    );
    const page = commentPage(raw, Boolean(options.full));
    for (const comment of page.comments) {
      const key = String(comment.id);
      if (!seen.has(key)) {
        seen.add(key);
        comments.push(comment);
      }
    }
    continuationToken = page.continuationToken;
  } while (options.all && continuationToken);

  return {
    context,
    organization: context.organization,
    project: context.project,
    workItemId: id,
    count: comments.length,
    comments,
    ...(!options.all && continuationToken ? { continuationToken } : {}),
  };
}

export function buildCommentsArgs(
  context: AzureDevOpsContext,
  id: string,
  top = DEFAULT_COMMENT_PAGE_SIZE,
  continuationToken?: string,
): string[] {
  validateWorkItemId(id);
  if (!Number.isInteger(top) || top < 1 || top > MAX_EVIDENCE_LIMIT) {
    throw new AzdoAxiError(
      `Comment page size must be an integer from 1 to ${MAX_EVIDENCE_LIMIT}.`,
      "VALIDATION_ERROR",
    );
  }
  return [
    "devops",
    "invoke",
    "--area",
    "wit",
    "--resource",
    "comments",
    "--route-parameters",
    `project=${context.project}`,
    `workItemId=${id}`,
    "--query-parameters",
    `$top=${top}`,
    ...(continuationToken ? [`continuationToken=${continuationToken}`] : []),
    "--organization",
    context.organization,
    "--api-version",
    "7.1-preview.4",
    "--output",
    "json",
    "--only-show-errors",
  ];
}

export async function listWorkItemAttachments(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  id: string,
  options: { limit?: number } = {},
): Promise<WorkItemAttachmentsResult> {
  validateWorkItemId(id);
  const limit = options.limit ?? DEFAULT_ATTACHMENT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_EVIDENCE_LIMIT) {
    throw new AzdoAxiError(
      `Attachment limit must be an integer from 1 to ${MAX_EVIDENCE_LIMIT}.`,
      "VALIDATION_ERROR",
    );
  }
  const item = await readRawWorkItem(
    runner,
    context,
    id,
    `work-item attachments ${id}`,
    false,
  );
  const available = attachmentRelations(item.relations, context);
  const attachments = available.slice(0, limit).map(attachmentOutput);
  return {
    context,
    organization: context.organization,
    project: context.project,
    workItemId: id,
    count: attachments.length,
    attachments,
    ...(available.length > attachments.length ? { truncated: true } : {}),
  };
}

export async function downloadWorkItemAttachment(
  runner: CommandRunner,
  context: AzureDevOpsContext,
  workItemId: string,
  selector: string,
  destination: string,
): Promise<WorkItemAttachmentDownloadResult> {
  validateWorkItemId(workItemId);
  if (!selector.trim()) {
    throw new AzdoAxiError(
      "An attachment ID or URL is required.",
      "VALIDATION_ERROR",
    );
  }
  if (!destination.trim()) {
    throw new AzdoAxiError("A download path is required.", "VALIDATION_ERROR");
  }
  const selected = parseAttachmentSelector(selector, context);
  const item = await readRawWorkItem(
    runner,
    context,
    workItemId,
    `work-item attachment download ${workItemId}`,
    false,
  );
  const attachment = attachmentRelations(item.relations, context).find(
    (relation) => relation.id === selected.id,
  );
  if (!attachment) {
    throw new AzdoAxiError(
      `Attachment ${selected.id} is not related to work item ${workItemId}.`,
      "AZ_ATTACHMENT_NOT_FOUND",
      [
        "Run `azdo-axi work-item attachments <work-item-id>` to select a listed attachment.",
      ],
    );
  }
  assertSupportedAttachmentMediaType(attachment.contentType);
  assertBufferedAttachmentSize(attachment.size);
  if (!runner.runBinary) {
    throw new AzdoAxiError(
      "Binary attachment download is unavailable for this Azure runner.",
      "AZ_ATTACHMENT_DOWNLOAD_UNAVAILABLE",
      ["Use the installed azdo-axi CLI to download the attachment."],
    );
  }
  let binary: Buffer;
  try {
    binary = await runner.runBinary(
      buildAttachmentDownloadArgs(context, attachment.id),
    );
  } catch (error) {
    throw normalizeAttachmentDownloadError(error);
  }
  assertBufferedAttachmentSize(binary.length);
  const path = await resolveDownloadPath(
    destination,
    attachment.filename,
    attachment.id,
  );
  try {
    await writeFile(path, binary, { flag: "wx" });
  } catch (error) {
    throw new AzdoAxiError(
      `Could not write the attachment to ${path}.`,
      "AZ_ATTACHMENT_WRITE_FAILED",
      ["Choose a writable new file path or an existing writable directory."],
    );
  }
  return {
    context,
    organization: context.organization,
    project: context.project,
    workItemId,
    attachmentId: attachment.id,
    path,
    size: binary.length,
    ...(attachment.contentType ? { contentType: attachment.contentType } : {}),
  };
}

export function buildAttachmentDownloadArgs(
  context: AzureDevOpsContext,
  attachmentId: string,
): string[] {
  if (!isAttachmentId(attachmentId)) {
    throw new AzdoAxiError("Attachment ID is not valid.", "VALIDATION_ERROR");
  }
  return [
    "devops",
    "invoke",
    "--area",
    "wit",
    "--resource",
    "attachments",
    "--route-parameters",
    `project=${context.project}`,
    `attachmentId=${attachmentId}`,
    "--organization",
    context.organization,
    "--api-version",
    "7.1",
    "--only-show-errors",
  ];
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

function commentPage(
  raw: unknown,
  full: boolean,
): { comments: Array<Record<string, unknown>>; continuationToken?: string } {
  const page = asRecord(raw);
  if (!Array.isArray(page.value)) {
    throw new AzdoAxiError(
      "Azure DevOps comments response did not contain a value array.",
      "AZ_COMMENTS_INVALID_OUTPUT",
      [
        "Retry the bounded comments request or update the Azure DevOps extension.",
      ],
    );
  }
  const continuationToken = stringProperty(
    page.continuationToken ?? page.continuationtoken,
  );
  return {
    comments: page.value.map((value) => commentOutput(value, full)),
    ...(continuationToken ? { continuationToken } : {}),
  };
}

function commentOutput(value: unknown, full: boolean): Record<string, unknown> {
  const comment = asRecord(value);
  if (typeof comment.id !== "number" && typeof comment.id !== "string") {
    throw new AzdoAxiError(
      "Azure DevOps returned a discussion comment without an ID.",
      "AZ_COMMENTS_INVALID_OUTPUT",
      ["Retry the request or inspect the work item in Azure DevOps."],
    );
  }
  if (typeof comment.text !== "string") {
    throw new AzdoAxiError(
      "Azure DevOps returned a discussion comment without text.",
      "AZ_COMMENTS_INVALID_OUTPUT",
      ["Retry the request or inspect the work item in Azure DevOps."],
    );
  }
  const result = compact({
    id: comment.id,
    author: personName(comment.createdBy ?? comment.modifiedBy),
    createdDate: comment.createdDate,
    modifiedDate: comment.modifiedDate,
  });
  if (comment.text.length === 0) {
    result.text = "";
  } else {
    addBoundedText(result, "text", comment.text, full);
  }
  return result;
}

interface AttachmentRelation {
  id: string;
  url: string;
  filename?: string;
  contentType?: string;
  size?: number;
  createdDate?: string;
  modifiedDate?: string;
}

function attachmentRelations(
  value: unknown,
  context: AzureDevOpsContext,
): AttachmentRelation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((relation) => isAttachmentRelation(asRecord(relation).rel))
    .map((relation) => attachmentRelation(asRecord(relation), context));
}

function isAttachmentRelation(value: unknown): boolean {
  return value === "AttachedFile" || value === "System.LinkTypes.AttachedFile";
}

function attachmentRelation(
  relation: Record<string, unknown>,
  context: AzureDevOpsContext,
): AttachmentRelation {
  if (typeof relation.url !== "string") {
    throw new AzdoAxiError(
      "Azure DevOps returned an attachment relation without a URL.",
      "AZ_ATTACHMENT_RELATION_INVALID",
      ["Inspect the work-item attachment relation in Azure DevOps and retry."],
    );
  }
  const parsed = parseAttachmentUrl(relation.url, context);
  const attributes = asRecord(relation.attributes);
  return {
    id: parsed.id,
    url: parsed.url,
    ...(stringProperty(attributes.name ?? attributes.fileName)
      ? { filename: stringProperty(attributes.name ?? attributes.fileName) }
      : {}),
    ...(stringProperty(attributes.contentType)
      ? { contentType: stringProperty(attributes.contentType) }
      : {}),
    ...(numberProperty(attributes.resourceSize ?? attributes.size) !== undefined
      ? { size: numberProperty(attributes.resourceSize ?? attributes.size) }
      : {}),
    ...(stringProperty(attributes.resourceCreatedDate ?? attributes.createdDate)
      ? {
          createdDate: stringProperty(
            attributes.resourceCreatedDate ?? attributes.createdDate,
          ),
        }
      : {}),
    ...(stringProperty(
      attributes.resourceModifiedDate ?? attributes.modifiedDate,
    )
      ? {
          modifiedDate: stringProperty(
            attributes.resourceModifiedDate ?? attributes.modifiedDate,
          ),
        }
      : {}),
  };
}

function attachmentOutput(
  attachment: AttachmentRelation,
): Record<string, unknown> {
  return compact({
    id: attachment.id,
    url: attachment.url,
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.size,
    createdDate: attachment.createdDate,
    modifiedDate: attachment.modifiedDate,
  });
}

function parseAttachmentSelector(
  selector: string,
  context: AzureDevOpsContext,
): { id: string } {
  if (isAttachmentId(selector)) return { id: selector.toLowerCase() };
  return parseAttachmentUrl(selector, context);
}

function parseAttachmentUrl(
  value: string,
  context: AzureDevOpsContext,
): { id: string; url: string } {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AzdoAxiError(
      "Attachment URL is malformed.",
      "AZ_ATTACHMENT_RELATION_INVALID",
      ["Select an attachment ID or URL returned by `work-item attachments`."],
    );
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new AzdoAxiError(
      "Attachment URL must be an HTTPS Azure DevOps URL without credentials.",
      "AZ_ATTACHMENT_URL_SCOPE_MISMATCH",
      ["Use an attachment URL returned for the resolved Azure DevOps context."],
    );
  }
  assertAttachmentUrlScope(url, context);
  const match = url.pathname.match(/\/attachments\/([^/]+)\/?$/i);
  const id = match?.[1];
  if (!id || !isAttachmentId(id)) {
    throw new AzdoAxiError(
      "Attachment URL does not contain a supported attachment ID.",
      "AZ_ATTACHMENT_RELATION_INVALID",
      ["Select an attachment URL returned by `work-item attachments`."],
    );
  }
  return { id: id.toLowerCase(), url: `${url.origin}${url.pathname}` };
}

function assertAttachmentUrlScope(url: URL, context: AzureDevOpsContext): void {
  let organizationUrl: URL | undefined;
  try {
    organizationUrl = new URL(context.organization);
  } catch {
    // Azure CLI also accepts an organization name; support its canonical dev.azure.com form.
  }
  const segments = url.pathname.split("/").filter(Boolean);
  if (organizationUrl) {
    const expectedSegments = organizationUrl.pathname
      .split("/")
      .filter(Boolean);
    if (
      url.hostname.toLowerCase() !== organizationUrl.hostname.toLowerCase() ||
      expectedSegments.some(
        (segment, index) => !sameAzureSegment(segments[index], segment),
      )
    ) {
      throw attachmentScopeMismatch();
    }
    const projectSegment = segments[expectedSegments.length];
    if (
      projectSegment &&
      projectSegment !== "_apis" &&
      !sameAzureSegment(projectSegment, context.project)
    ) {
      throw attachmentScopeMismatch();
    }
    return;
  }
  const organization = context.organization.toLowerCase();
  if (!(
    (url.hostname.toLowerCase() === "dev.azure.com" &&
      sameAzureSegment(segments[0], organization)) ||
    url.hostname.toLowerCase() === `${organization}.visualstudio.com`
  )) {
    throw attachmentScopeMismatch();
  }
  const projectIndex = url.hostname.toLowerCase() === "dev.azure.com" ? 1 : 0;
  const projectSegment = segments[projectIndex];
  if (
    projectSegment &&
    projectSegment !== "_apis" &&
    !sameAzureSegment(projectSegment, context.project)
  ) {
    throw attachmentScopeMismatch();
  }
}

function sameAzureSegment(
  value: string | undefined,
  expected: string,
): boolean {
  if (value === undefined) return false;
  try {
    return decodeURIComponent(value).toLowerCase() === expected.toLowerCase();
  } catch {
    return false;
  }
}

function attachmentScopeMismatch(): AzdoAxiError {
  return new AzdoAxiError(
    "Attachment URL does not belong to the resolved Azure DevOps organization and project.",
    "AZ_ATTACHMENT_URL_SCOPE_MISMATCH",
    ["Run `azdo-axi context` and select an attachment listed for that target."],
  );
}

function isAttachmentId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function assertSupportedAttachmentMediaType(
  contentType: string | undefined,
): void {
  if (!contentType) return;
  if (
    /^(?:text\/html|application\/(?:xhtml\+xml|javascript|ecmascript)|image\/svg\+xml)$/i.test(
      contentType,
    )
  ) {
    throw new AzdoAxiError(
      `Attachment media type ${contentType} is not supported for download.`,
      "AZ_ATTACHMENT_MEDIA_TYPE_UNSUPPORTED",
      [
        "Download a non-renderable file type or inspect the attachment in Azure DevOps.",
      ],
    );
  }
}

async function resolveDownloadPath(
  destination: string,
  filename: string | undefined,
  attachmentId: string,
): Promise<string> {
  const resolved = resolve(destination);
  try {
    if ((await stat(resolved)).isDirectory()) {
      return resolve(resolved, safeAttachmentFilename(filename, attachmentId));
    }
  } catch {
    if (destination.endsWith("/") || destination.endsWith("\\")) {
      throw new AzdoAxiError(
        `Download directory does not exist: ${resolved}.`,
        "AZ_ATTACHMENT_WRITE_FAILED",
        ["Create the directory first or provide a new file path."],
      );
    }
  }
  return resolved;
}

function safeAttachmentFilename(
  filename: string | undefined,
  attachmentId: string,
): string {
  const name = basename(filename ?? "")
    .replace(/[\x00-\x1f]/g, "")
    .trim();
  return name && name !== "." && name !== ".." ? name : attachmentId;
}

function assertBufferedAttachmentSize(size: number | undefined): void {
  if (size === undefined || size <= MAX_BUFFERED_ATTACHMENT_SIZE) return;
  throw new AzdoAxiError(
    `Attachment size ${size} bytes exceeds the ${MAX_BUFFERED_ATTACHMENT_SIZE / (1024 * 1024)} MiB download limit.`,
    "AZ_ATTACHMENT_SIZE_LIMIT",
    [
      "Choose a smaller attachment or retrieve the file directly from Azure DevOps.",
    ],
  );
}

function normalizeAttachmentDownloadError(error: unknown): AzdoAxiError {
  if (error instanceof AzdoAxiError) {
    return error;
  }
  const normalized = normalizeAzureError(error, "attachment download");
  return new AzdoAxiError(normalized.message, "AZ_ATTACHMENT_DOWNLOAD_FAILED", [
    "Verify attachment access and retry with a writable local destination.",
  ]);
}

function stringProperty(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberProperty(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
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

async function runAzure(
  runner: CommandRunner,
  args: string[],
  operation: string,
): Promise<void> {
  try {
    await runner.run(args);
  } catch (error) {
    throw normalizeAzureError(error, operation);
  }
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
      withAzureErrorDetail(
        `Azure DevOps authentication failed for ${operation}.`,
        error,
      ),
      "AZ_AUTHENTICATION_FAILED",
      ["Run `az login` and verify access to the selected organization."],
    );
  }
  if (/forbidden|permission|403|not authorized/.test(text)) {
    return new AzdoAxiError(
      withAzureErrorDetail(
        `Azure DevOps denied access to ${operation}.`,
        error,
      ),
      "AZ_PERMISSION_DENIED",
      ["Verify your account can read this project and work item."],
    );
  }
  if (/not found|does not exist|404/.test(text)) {
    return new AzdoAxiError(
      withAzureErrorDetail(
        `Azure DevOps ${operation} resource was not found.`,
        error,
      ),
      /work-item (show|links|update|relation)/.test(operation)
        ? "WORK_ITEM_NOT_FOUND"
        : "AZ_RESOURCE_NOT_FOUND",
      ["Check the work-item ID and resolved organization/project context."],
    );
  }
  return new AzdoAxiError(
    withAzureErrorDetail(`Azure DevOps ${operation} request failed.`, error),
    "AZ_BOARDS_REQUEST_FAILED",
    [
      "Run `az devops configure --list` and verify the organization/project context.",
    ],
  );
}

function withAzureErrorDetail(message: string, error: unknown): string {
  const detail = safeAzureErrorDetail(error);
  return detail ? `${message} Azure CLI: ${detail}` : message;
}

function safeAzureErrorDetail(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const stderr = (error as Record<string, unknown>).stderr;
  if (typeof stderr !== "string" || stderr.trim().length === 0) {
    return undefined;
  }
  const detail = stderr
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(
      /(\bauthorization\s*:\s*)(?:[^\s]+\s+)?(?:([\"'])[^\"']*\2|[^\s\"',;]+)/gi,
      "$1[redacted]",
    )
    .replace(
      /((?:[\"']?)(?:access[_-]?token|refresh[_-]?token|id[_-]?token)(?:[\"']?)\s*:\s*)\"[^\"]*\"/gi,
      '$1"[redacted]"',
    )
    .replace(
      /((?:[\"']?)(?:access[_-]?token|refresh[_-]?token|id[_-]?token)(?:[\"']?)\s*:\s*)'[^']*'/gi,
      "$1'[redacted]'",
    )
    .replace(
      /\b(authorization|(?:access[_-]?|refresh[_-]?|id[_-]?)token)\s*=\s*(?:(?:bearer|basic)\s+)?(?:\"[^\"]*\"|'[^']*'|[^\s,;]+)/gi,
      "$1=[redacted]",
    )
    .replace(
      /\bbearer\s+(?:\"[^\"]*\"|'[^']*'|[^\s,;]+)/gi,
      "Bearer [redacted]",
    )
    .replace(
      /((?:[\"']?)(?:password|passwd|pat|token|secret|client[_-]?secret|clientSecret|api[_-]?key|apiKey|private[_-]?key)(?:[\"']?)\s*:\s*)([\"'])[^\"']*\2/gi,
      "$1$2[redacted]$2",
    )
    .replace(/((?:https?:\/\/)[^\s/:]+):[^\s@]+@/gi, "$1:[redacted]@")
    .replace(
      /\b(password|passwd|pat|token|secret|client[_-]?secret|clientSecret|api[_-]?key|apiKey|private[_-]?key)\s*[=:]\s*[^\s]+/gi,
      "$1=[redacted]",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (!detail) return undefined;
  return detail.length > 500 ? `${detail.slice(0, 497)}...` : detail;
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
