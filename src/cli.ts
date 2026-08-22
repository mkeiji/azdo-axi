import { runAxiCli } from "axi-sdk-js";

import { NodeAzRunner, type CommandRunner } from "./az.js";
import { parseInvocation, type ParsedInvocation } from "./arguments.js";
import {
  resolveContext,
  type AzureDevOpsContext,
  type Environment,
} from "./context.js";
import { AzdoAxiError } from "./errors.js";
import { VERSION } from "./version.js";
import {
  createWorkItem,
  linkWorkItem,
  listWorkItems,
  queryWorkItems,
  showWorkItem,
  updateWorkItem,
} from "./work-items.js";

const TOP_LEVEL_HELP = `usage: azdo-axi <command> [args] [flags]
commands:
  context                         Show the resolved Azure DevOps context
  work-item list                  List active Task work items
  work-item show <id>             Show work-item details
  work-item create                Create a work item
  work-item update <id>           Update a work item
  work-item links <id>            Prepare work-item link inspection
  query --wiql <query>            Prepare a WIQL query
context flags: --organization <org> --project <project> [--team <team>] [--iteration <iteration>]
list flags: --assignee <user> --iteration <path> --area <path> [--full]
show flags: [--full]
create flags: --type <type> --title <title> [--description <text>] [--parent <id>] [--iteration <path>] [--assignee <user>] [--area <path>] [--field <name=value>]...
update flags: [--title <title>] [--description <text>] [--state <state>] [--tags <tags>] [--assignee <user>] [--iteration <path>] [--area <path>] [--field <name=value>]...
`;

export interface CliDependencies {
  runner?: CommandRunner;
  environment?: Environment;
  stdout?: { write(chunk: string): unknown };
}

export async function runCli(
  argv = process.argv.slice(2),
  dependencies: CliDependencies = {},
): Promise<void> {
  const runner = dependencies.runner ?? new NodeAzRunner();
  const environment = dependencies.environment ?? process.env;

  await runAxiCli<AzureDevOpsContext | undefined>({
    description: "Agent-friendly Azure DevOps Boards CLI wrapper",
    version: VERSION,
    argv,
    stdout: dependencies.stdout,
    topLevelHelp: TOP_LEVEL_HELP,
    getCommandHelp: (command) =>
      command === "context" || command === "work-item" || command === "query"
        ? TOP_LEVEL_HELP
        : undefined,
    resolveContext: async ({ command, args }) => {
      if (!command) {
        return undefined;
      }
      const invocation = parseInvocation(command, args);
      return resolveContext(invocation, runner, environment);
    },
    home: async () => ({
      commands: ["context", "work-item", "query"],
      help: ["Run `azdo-axi context` to verify the Azure DevOps target."],
    }),
    commands: {
      context: async (_args, context) => contextOutput(context),
      "work-item": async (args, context) => {
        const invocation = parseInvocation("work-item", args);
        if (!context) {
          throw new AzdoAxiError(
            "Azure DevOps context could not be resolved.",
            "AZDO_CONTEXT_MISSING",
          );
        }
        if (invocation.route === "work-item list") {
          return listWorkItems(runner, context, invocation);
        }
        if (invocation.route === "work-item show") {
          return showWorkItem(runner, context, invocation.id!, invocation);
        }
        if (invocation.route === "work-item links") {
          return linkWorkItem(runner, context, invocation.id!);
        }
        if (invocation.route === "work-item create") {
          return createWorkItem(runner, context, invocation);
        }
        if (invocation.route === "work-item update") {
          return updateWorkItem(runner, context, invocation.id!, invocation);
        }
        return unavailable(invocation, context);
      },
      query: async (args, context) => {
        const invocation = parseInvocation("query", args);
        if (!context) {
          throw new AzdoAxiError(
            "Azure DevOps context could not be resolved.",
            "AZDO_CONTEXT_MISSING",
          );
        }
        return queryWorkItems(runner, context, invocation.wiql!);
      },
    },
  });
}

function contextOutput(
  context: AzureDevOpsContext | undefined,
): Record<string, unknown> {
  if (!context) {
    throw new AzdoAxiError(
      "Azure DevOps context could not be resolved.",
      "AZDO_CONTEXT_MISSING",
    );
  }
  return { context };
}

function unavailable(
  invocation: ParsedInvocation,
  context: AzureDevOpsContext | undefined,
): never {
  throw new AzdoAxiError(
    `The ${invocation.route} operation is not available in this release.`,
    "FEATURE_NOT_AVAILABLE",
    [
      `Resolved target: ${context?.organization ?? "unknown"} / ${context?.project ?? "unknown"}.`,
      "Run `azdo-axi context` to inspect the active Azure DevOps context.",
    ],
  );
}

export { TOP_LEVEL_HELP };
