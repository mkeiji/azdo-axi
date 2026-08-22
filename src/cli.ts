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

const TOP_LEVEL_HELP = `usage: azdo-axi <command> [args] [flags]
commands:
  context                         Show the resolved Azure DevOps context
  work-item list                  Prepare work-item listing
  work-item show <id>             Prepare work-item inspection
  work-item create                Prepare work-item creation
  work-item update <id>           Prepare work-item update
  work-item links <id>            Prepare work-item link inspection
  query --wiql <query>            Prepare a WIQL query
context flags: --organization <org> --project <project> [--team <team>] [--iteration <iteration>]
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
      "work-item": async (args, context) =>
        unavailable(parseInvocation("work-item", args), context),
      query: async (args, context) =>
        unavailable(parseInvocation("query", args), context),
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
