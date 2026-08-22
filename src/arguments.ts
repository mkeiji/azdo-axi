import { validationError } from "./errors.js";

export type Route =
  | "context"
  | "work-item list"
  | "work-item show"
  | "work-item create"
  | "work-item update"
  | "work-item links"
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
    !["list", "show", "create", "update", "links"].includes(action)
  ) {
    throw validationError(
      "`work-item` requires one of: list, show, create, update, links.",
    );
  }

  const values = parseFlags(
    rest,
    action === "list"
      ? workItemFilterFlags
      : action === "show"
        ? new Set([...scopeFlags, "full"])
        : scopeFlags,
    new Set(["full"]),
  );
  if (action === "show" || action === "update" || action === "links") {
    const id = positional(rest, new Set(["full"]));
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
    };
  }

  const positions = positional(rest, new Set(["full"]));
  if (positions.length > 0) {
    throw validationError(
      `\`work-item ${action}\` does not accept positional arguments.`,
    );
  }
  return {
    route: `work-item ${action}` as Route,
    ...canonicalWorkItemValues(values),
  };
}

function canonicalWorkItemValues(
  values: Omit<ParsedInvocation, "route" | "id"> &
    Record<string, string | boolean | undefined>,
): Omit<ParsedInvocation, "route" | "id"> {
  const assignee =
    typeof values.assignee === "string"
      ? values.assignee
      : typeof values["assigned-to"] === "string"
        ? values["assigned-to"]
        : undefined;
  const area =
    typeof values.area === "string"
      ? values.area
      : typeof values["area-path"] === "string"
        ? values["area-path"]
        : undefined;
  return {
    ...(values.organization ? { organization: values.organization } : {}),
    ...(values.project ? { project: values.project } : {}),
    ...(values.team ? { team: values.team } : {}),
    ...(values.iteration ? { iteration: values.iteration } : {}),
    ...(assignee ? { assignee } : {}),
    ...(area ? { area } : {}),
    ...(values.full === true ? { full: true } : {}),
  };
}

function parseFlags(
  args: string[],
  allowed: Set<string>,
  booleanFlags: Set<string> = new Set(),
): Omit<ParsedInvocation, "route" | "id"> {
  const result: Record<string, string | boolean> = {};
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
    if (Object.hasOwn(result, name)) {
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
    result[name] = value;
  }
  return result as Omit<ParsedInvocation, "route" | "id">;
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
