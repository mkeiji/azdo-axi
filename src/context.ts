import type { AzureDevOpsPreflight, CommandRunner } from "./az.js";
import { preflightAzureDevOps } from "./az.js";
import type { ParsedInvocation } from "./arguments.js";
import { AzdoAxiError } from "./errors.js";

export interface AzureDevOpsContext {
  organization: string;
  project: string;
  team?: string;
  iteration?: string;
}

export type Environment = Record<string, string | undefined>;

export async function resolveContext(
  invocation: ParsedInvocation,
  runner: CommandRunner,
  environment: Environment = process.env,
): Promise<AzureDevOpsContext> {
  const preflight = await preflightAzureDevOps(
    runner,
    contextNeedsDefaults(invocation, environment),
  );
  return resolveContextValues(invocation, environment, preflight);
}

export function resolveContextValues(
  invocation: Pick<
    ParsedInvocation,
    "organization" | "project" | "team" | "iteration"
  >,
  environment: Environment,
  preflight: AzureDevOpsPreflight,
): AzureDevOpsContext {
  const organization = resolveRequired(
    "organization",
    invocation.organization,
    environment,
    preflight.defaults,
  );
  const project = resolveRequired(
    "project",
    invocation.project,
    environment,
    preflight.defaults,
  );
  const team = resolveOptional(
    "team",
    invocation.team,
    environment,
    preflight.defaults,
  );
  const iteration = resolveOptional(
    "iteration",
    invocation.iteration,
    environment,
    preflight.defaults,
  );

  return {
    organization,
    project,
    ...(team ? { team } : {}),
    ...(iteration ? { iteration } : {}),
  };
}

function contextNeedsDefaults(
  invocation: Pick<
    ParsedInvocation,
    "organization" | "project" | "team" | "iteration"
  >,
  environment: Environment,
): boolean {
  return !(["organization", "project", "team", "iteration"] as const).every(
    (field) =>
      Boolean(invocation[field]) ||
      distinct(envNames(field).map((name) => environment[name])).length > 0,
  );
}

function resolveRequired(
  field: "organization" | "project",
  explicit: string | undefined,
  environment: Environment,
  defaults: unknown,
): string {
  return (
    resolve(field, explicit, environment, defaults) ?? missingContext(field)
  );
}

function resolveOptional(
  field: "team" | "iteration",
  explicit: string | undefined,
  environment: Environment,
  defaults: unknown,
): string | undefined {
  return resolve(field, explicit, environment, defaults);
}

function resolve(
  field: "organization" | "project" | "team" | "iteration",
  explicit: string | undefined,
  environment: Environment,
  defaults: unknown,
): string | undefined {
  if (explicit) {
    return explicit;
  }

  const environmentValues = distinct(
    envNames(field).map((name) => environment[name]),
  );
  if (environmentValues.length > 1) {
    throw ambiguousContext(field, environmentValues, "environment variables");
  }
  if (environmentValues.length === 1) {
    return environmentValues[0];
  }

  const defaultValues = defaultValuesFor(defaults, field);
  if (defaultValues.length > 1) {
    throw ambiguousContext(field, defaultValues, "Azure DevOps CLI defaults");
  }
  return defaultValues[0];
}

function missingContext(field: string): never {
  throw new AzdoAxiError(
    `Azure DevOps ${field} context is missing.`,
    "AZDO_CONTEXT_MISSING",
    [
      `Pass --${field} <${field}>.`,
      `Or configure it with \`az devops configure --defaults ${field}=<${field}>\`.`,
    ],
  );
}

function ambiguousContext(
  field: string,
  values: string[],
  source: string,
): AzdoAxiError {
  return new AzdoAxiError(
    `Azure DevOps ${field} context is ambiguous in ${source}.`,
    "AZDO_CONTEXT_AMBIGUOUS",
    [`Pass --${field} <${field}> to select the intended Azure DevOps target.`],
  );
}

function envNames(field: string): string[] {
  const suffix = field === "organization" ? "ORG" : field.toUpperCase();
  return [`AZDO_${suffix}`, `AZURE_DEVOPS_${suffix}`];
}

function defaultValuesFor(defaults: unknown, field: string): string[] {
  const values: string[] = [];
  const defaultName = `defaults.${field}`;
  collectDefaultValues(defaults, field, defaultName, values);
  return distinct(values);
}

function collectDefaultValues(
  value: unknown,
  field: string,
  defaultName: string,
  values: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item) =>
      collectDefaultValues(item, field, defaultName, values),
    );
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  if (record.name === defaultName && typeof record.value === "string") {
    values.push(record.value);
  }
  const direct = record[defaultName];
  if (typeof direct === "string") {
    values.push(direct);
  }
  const nestedDefaults = record.defaults;
  if (nestedDefaults && typeof nestedDefaults === "object") {
    const nested = (nestedDefaults as Record<string, unknown>)[field];
    if (typeof nested === "string") {
      values.push(nested);
    }
  }
  Object.values(record).forEach((item) =>
    collectDefaultValues(item, field, defaultName, values),
  );
}

function distinct(values: Array<string | undefined>): string[] {
  return [
    ...new Set(
      values
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim()),
    ),
  ];
}
