import { isValidFieldReferenceName } from "./field-validation.js";
import { validationError } from "./errors.js";

export type Route =
  | "context"
  | "work-item list"
  | "work-item show"
  | "work-item create"
  | "work-item update"
  | "work-item links"
  | "work-item comments"
  | "work-item attachments"
  | "work-item attachment download"
  | "query";

export interface ParsedInvocation {
  route: Route;
  organization?: string;
  project?: string;
  team?: string;
  iteration?: string;
  assignee?: string;
  area?: string;
  full?: boolean;
  wiql?: string;
  id?: string;
  workItemType?: string;
  title?: string;
  description?: string;
  parent?: string;
  state?: string;
  tags?: string;
  fields?: Record<string, string>;
  top?: number;
  limit?: number;
  continuationToken?: string;
  all?: boolean;
  attachment?: string;
  path?: string;
}

const scopeFlags = new Set(["organization", "project", "team", "iteration"]);
const workItemFilterFlags = new Set([
  ...scopeFlags,
  "assignee",
  "assigned-to",
  "area",
  "area-path",
  "full",
]);
const workItemEvidenceFlags = new Set([
  ...scopeFlags,
  "full",
  "top",
  "limit",
  "continuation-token",
  "all",
]);
const workItemAttachmentDownloadFlags = new Set([...scopeFlags, "path"]);
const workItemMutationFlags = new Set([
  ...scopeFlags,
  "assignee",
  "assigned-to",
  "area",
  "area-path",
  "iteration",
  "type",
  "work-item-type",
  "title",
  "description",
  "parent",
  "state",
  "tags",
  "tag",
  "field",
]);

export function parseInvocation(
  command: string,
  args: string[],
): ParsedInvocation {
  if (command === "context") {
    assertNoPositionals(args, "`context`");
    const values = parseFlags(args, scopeFlags);
    return { route: "context", ...values };
  }

  if (command === "query") {
    assertNoPositionals(args, "`query`");
    const values = parseFlags(args, new Set([...scopeFlags, "wiql"]));
    if (!values.wiql) {
      throw validationError("`query` requires `--wiql <query>`.", [
        'Run `azdo-axi query --wiql "SELECT [System.Id] FROM WorkItems"`.',
      ]);
    }
    return { route: "query", ...values };
  }

  if (command !== "work-item") {
    throw validationError(`Unknown command: ${command}`, [
      "Run `azdo-axi --help` to see available commands.",
    ]);
  }

  const [action, ...rest] = args;
  if (
    !action ||
    ![
      "list",
      "show",
      "create",
      "update",
      "links",
      "comments",
      "attachments",
      "attachment",
    ].includes(action)
  ) {
    throw validationError(
      "`work-item` requires one of: list, show, create, update, links, comments, attachments, attachment.",
    );
  }

  if (action === "attachment") {
    const [operation, ...downloadArgs] = rest;
    if (operation !== "download") {
      throw validationError("`work-item attachment` requires `download`.", [
        "Run `azdo-axi work-item attachment download <work-item-id> <attachment-id-or-url> --path <destination>`.",
      ]);
    }
    const values = parseFlags(downloadArgs, workItemAttachmentDownloadFlags);
    const positions = positional(downloadArgs);
    if (positions.length !== 2 || !stringValue(values.path)) {
      throw validationError(
        "`work-item attachment download` requires a work-item ID, attachment ID or URL, and --path <destination>.",
      );
    }
    return {
      route: "work-item attachment download",
      id: positions[0],
      attachment: positions[1],
      path: stringValue(values.path),
      ...canonicalWorkItemValues(values),
    };
  }

  const values = parseFlags(
    rest,
    action === "list"
      ? workItemFilterFlags
      : action === "show"
        ? new Set([...scopeFlags, "full"])
        : action === "comments" || action === "attachments"
          ? workItemEvidenceFlags
          : action === "create" || action === "update"
            ? workItemMutationFlags
            : scopeFlags,
    new Set(["full", "all"]),
    action === "create" || action === "update"
      ? new Set(["field", "tag"])
      : new Set(),
  );
  if (
    action === "show" ||
    action === "update" ||
    action === "links" ||
    action === "comments" ||
    action === "attachments"
  ) {
    const id = positional(rest, new Set(["full", "all"]));
    if (id.length !== 1) {
      throw validationError(
        `\`work-item ${action}\` requires exactly one work-item ID.`,
        [`Run \`azdo-axi work-item ${action} <id>\`.`],
      );
    }
    return {
      route: `work-item ${action}` as Route,
      id: id[0],
      ...canonicalWorkItemValues(values),
      ...evidenceValues(values, action),
    };
  }

  const positions = positional(rest, new Set(["full", "all"]));
  if (positions.length > 0) {
    throw validationError(
      `\`work-item ${action}\` does not accept positional arguments.`,
    );
  }
  const canonical = canonicalWorkItemValues(values);
  return {
    route: `work-item ${action}` as Route,
    ...canonical,
  };
}

function canonicalWorkItemValues(
  values: Record<string, string | boolean | string[] | undefined>,
): Omit<ParsedInvocation, "route" | "id"> {
  rejectConflictingAliases(values, "assignee", "assigned-to");
  rejectConflictingAliases(values, "area", "area-path");
  rejectConflictingAliases(values, "type", "work-item-type");
  if (values.tags !== undefined && values.tag !== undefined) {
    throw validationError("Options --tags and --tag cannot be used together.");
  }

  const assignee =
    stringValue(values.assignee) ?? stringValue(values["assigned-to"]);
  const area = stringValue(values.area) ?? stringValue(values["area-path"]);
  const workItemType =
    stringValue(values.type) ?? stringValue(values["work-item-type"]);
  const tags =
    stringValue(values.tags) ?? stringArrayValue(values.tag)?.join("; ");
  const fields = parseCustomFields(values.field);
  return {
    ...(stringValue(values.organization)
      ? { organization: stringValue(values.organization) }
      : {}),
    ...(stringValue(values.project)
      ? { project: stringValue(values.project) }
      : {}),
    ...(stringValue(values.team) ? { team: stringValue(values.team) } : {}),
    ...(stringValue(values.iteration)
      ? { iteration: stringValue(values.iteration) }
      : {}),
    ...(assignee ? { assignee } : {}),
    ...(area ? { area } : {}),
    ...(workItemType ? { workItemType } : {}),
    ...(stringValue(values.title) !== undefined
      ? { title: stringValue(values.title) }
      : {}),
    ...(stringValue(values.description) !== undefined
      ? { description: stringValue(values.description) }
      : {}),
    ...(stringValue(values.parent) !== undefined
      ? { parent: stringValue(values.parent) }
      : {}),
    ...(stringValue(values.state) !== undefined
      ? { state: stringValue(values.state) }
      : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(Object.keys(fields).length > 0 ? { fields } : {}),
    ...(values.full === true ? { full: true } : {}),
  };
}

function evidenceValues(
  values: Record<string, string | boolean | string[] | undefined>,
  action: string,
): Omit<ParsedInvocation, "route" | "id"> {
  if (action !== "comments" && action !== "attachments") return {};
  const top = boundedOption(values.top, "top", 200);
  const limit = boundedOption(values.limit, "limit", 200);
  if (action === "comments" && limit !== undefined) {
    throw validationError(
      "Option --limit is only supported by `work-item attachments`.",
    );
  }
  if (
    action === "attachments" &&
    (top !== undefined ||
      values["continuation-token"] !== undefined ||
      values.all === true ||
      values.full === true)
  ) {
    throw validationError(
      "Comments options are not supported by `work-item attachments`.",
    );
  }
  return {
    ...(top !== undefined ? { top } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(stringValue(values["continuation-token"])
      ? { continuationToken: stringValue(values["continuation-token"]) }
      : {}),
    ...(values.all === true ? { all: true } : {}),
  };
}

function boundedOption(
  value: string | boolean | string[] | undefined,
  name: string,
  maximum: number,
): number | undefined {
  const text = stringValue(value);
  if (text === undefined) return undefined;
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > maximum) {
    throw validationError(
      `Option --${name} must be an integer from 1 to ${maximum}.`,
    );
  }
  return Number(text);
}

function rejectConflictingAliases(
  values: Record<string, string | boolean | string[] | undefined>,
  canonical: string,
  alias: string,
): void {
  if (values[canonical] !== undefined && values[alias] !== undefined) {
    throw validationError(
      `Options --${canonical} and --${alias} cannot be used together.`,
      [`Choose either --${canonical} or --${alias}, not both.`],
    );
  }
}

function parseFlags(
  args: string[],
  allowed: Set<string>,
  booleanFlags: Set<string> = new Set(),
  repeatableFlags: Set<string> = new Set(),
): Record<string, string | boolean | string[]> {
  const result: Record<string, string | boolean | string[]> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("-")) {
      continue;
    }
    if (!arg.startsWith("--")) {
      throw validationError(`Unsupported option: ${arg}`);
    }
    const [name, inlineValue] = arg.slice(2).split(/=(.*)/s, 2);
    if (!allowed.has(name)) {
      throw validationError(`Unsupported option: --${name}`, [
        "Run the command with `--help` to see accepted options.",
      ]);
    }
    if (Object.hasOwn(result, name) && !repeatableFlags.has(name)) {
      throw validationError(`Option --${name} was provided more than once.`);
    }
    if (booleanFlags.has(name)) {
      if (inlineValue !== undefined) {
        throw validationError(`Option --${name} does not accept a value.`);
      }
      result[name] = true;
      continue;
    }
    const value = inlineValue ?? args[++index];
    if (!value || value.startsWith("--")) {
      throw validationError(`Option --${name} requires a value.`);
    }
    if (repeatableFlags.has(name)) {
      const previous = result[name];
      result[name] = [
        ...(Array.isArray(previous)
          ? previous
          : previous
            ? [String(previous)]
            : []),
        value,
      ];
    } else {
      result[name] = value;
    }
  }
  return result;
}

function stringValue(
  value: string | boolean | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringArrayValue(
  value: string | boolean | string[] | undefined,
): string[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function parseCustomFields(
  value: string | boolean | string[] | undefined,
): Record<string, string> {
  const fields =
    stringArrayValue(value) ??
    (stringValue(value) ? [stringValue(value)!] : []);
  const result: Record<string, string> = {};
  for (const field of fields) {
    const separator = field.indexOf("=");
    const name = separator >= 0 ? field.slice(0, separator).trim() : "";
    if (!isValidFieldReferenceName(name)) {
      throw validationError(
        "Each --field value must use a valid `Reference.Name=value` syntax.",
      );
    }
    if (Object.hasOwn(result, name)) {
      throw validationError(
        `Custom field --field ${name} was provided more than once.`,
      );
    }
    result[name] = field.slice(separator + 1);
  }
  return result;
}

function assertNoPositionals(args: string[], route: string): void {
  const values = positional(args);
  if (values.length > 0) {
    throw validationError(
      `${route} does not accept positional arguments: ${values.join(", ")}.`,
    );
  }
}

function positional(
  args: string[],
  booleanFlags = new Set<string>(),
): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (!args[index].startsWith("-")) {
      values.push(args[index]);
      continue;
    }
    if (!args[index].includes("=") && !booleanFlags.has(args[index].slice(2))) {
      index += 1;
    }
  }
  return values;
}
