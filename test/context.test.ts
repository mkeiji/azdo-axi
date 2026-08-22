import { describe, expect, it } from "vitest";

import type { AzureDevOpsPreflight, CommandRunner } from "../src/az.js";
import { preflightAzureDevOps } from "../src/az.js";
import { parseInvocation } from "../src/arguments.js";
import { runCli } from "../src/cli.js";
import { resolveContextValues } from "../src/context.js";

const defaults: AzureDevOpsPreflight = {
  defaults: [
    {
      name: "defaults.organization",
      value: "https://dev.azure.com/default-org",
    },
    { name: "defaults.project", value: "default-project" },
  ],
};

describe("Azure DevOps context resolution", () => {
  it("uses explicit values before environment variables and CLI defaults", () => {
    const result = resolveContextValues(
      {
        organization: "https://dev.azure.com/selected",
        project: "selected-project",
      },
      {
        AZDO_ORG: "https://dev.azure.com/environment",
        AZDO_PROJECT: "environment-project",
      },
      defaults,
    );

    expect(result).toEqual({
      organization: "https://dev.azure.com/selected",
      project: "selected-project",
    });
  });

  it("uses environment values before CLI defaults", () => {
    const result = resolveContextValues(
      {},
      {
        AZURE_DEVOPS_ORG: "https://dev.azure.com/environment",
        AZURE_DEVOPS_PROJECT: "environment-project",
      },
      defaults,
    );

    expect(result).toEqual({
      organization: "https://dev.azure.com/environment",
      project: "environment-project",
    });
  });

  it("fails when required context is missing", () => {
    expect(() => resolveContextValues({}, {}, { defaults: {} })).toThrow(
      "organization context is missing",
    );
  });

  it("fails on conflicting environment context", () => {
    expect(() =>
      resolveContextValues(
        { project: "project" },
        {
          AZDO_ORG: "https://dev.azure.com/one",
          AZURE_DEVOPS_ORG: "https://dev.azure.com/two",
        },
        defaults,
      ),
    ).toThrow("organization context is ambiguous");
  });

  it("reports team and iteration when configured", () => {
    expect(
      resolveContextValues(
        {},
        {
          AZDO_ORG: "org",
          AZDO_PROJECT: "project",
          AZDO_TEAM: "team",
          AZDO_ITERATION: "iteration",
        },
        { defaults: {} },
      ),
    ).toEqual({
      organization: "org",
      project: "project",
      team: "team",
      iteration: "iteration",
    });
  });
});

describe("Azure CLI preflight", () => {
  it("reports an actionable failure when Azure CLI is unavailable", async () => {
    const runner: CommandRunner = {
      run: async () => Promise.reject(new Error("not found")),
    };
    await expect(preflightAzureDevOps(runner)).rejects.toMatchObject({
      code: "AZ_CLI_UNAVAILABLE",
    });
  });

  it("uses JSON output when checking Azure DevOps defaults", async () => {
    const calls: string[][] = [];
    const runner: CommandRunner = {
      run: async (args) => {
        calls.push([...args]);
        return "{}";
      },
    };

    await preflightAzureDevOps(runner);

    expect(calls[1]).toContain("--output");
    expect(calls[1]).toContain("json");
    expect(calls[2]).toContain("--output");
    expect(calls[2]).toContain("json");
  });

  it("reports an actionable failure when the Azure DevOps extension is unavailable", async () => {
    const runner: CommandRunner = {
      run: async (args) =>
        args[0] === "--version"
          ? "azure-cli"
          : Promise.reject(new Error("extension missing")),
    };
    await expect(preflightAzureDevOps(runner)).rejects.toMatchObject({
      code: "AZ_DEVOPS_EXTENSION_UNAVAILABLE",
    });
  });
});

describe("argument safety", () => {
  it("rejects unsupported flags before Azure CLI is invoked", async () => {
    let calls = 0;
    const runner: CommandRunner = {
      run: async () => {
        calls += 1;
        return "{}";
      },
    };
    const output: string[] = [];
    const originalExitCode = process.exitCode;
    process.exitCode = undefined;

    await runCli(["query", "--unknown", "value"], {
      runner,
      stdout: { write: (value) => output.push(value) },
    });

    expect(calls).toBe(0);
    expect(output.join("")).toContain("Unsupported option: --unknown");
    process.exitCode = originalExitCode;
  });

  it("routes every declared work-item command shape", () => {
    expect(parseInvocation("work-item", ["list"]).route).toBe("work-item list");
    expect(parseInvocation("work-item", ["show", "42"]).id).toBe("42");
    expect(parseInvocation("work-item", ["create"]).route).toBe(
      "work-item create",
    );
    expect(parseInvocation("work-item", ["update", "42"]).route).toBe(
      "work-item update",
    );
    expect(parseInvocation("work-item", ["links", "42"]).route).toBe(
      "work-item links",
    );
    expect(
      parseInvocation("query", ["--wiql", "SELECT [System.Id] FROM WorkItems"])
        .route,
    ).toBe("query");
  });

  it("rejects unexpected positional values on option-only routes", () => {
    expect(() => parseInvocation("context", ["unintended"])).toThrow(
      "does not accept positional arguments: unintended",
    );
    expect(() =>
      parseInvocation("query", [
        "--wiql",
        "SELECT [System.Id] FROM WorkItems",
        "unintended",
      ]),
    ).toThrow("does not accept positional arguments: unintended");
  });

  it("requires WIQL before Azure CLI is invoked", () => {
    expect(() => parseInvocation("query", [])).toThrow("requires `--wiql");
  });
});
