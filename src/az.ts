import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { AzdoAxiError } from "./errors.js";

const execFileAsync = promisify(execFile);

export interface CommandRunner {
  run(args: readonly string[]): Promise<string>;
  runBinary?(args: readonly string[]): Promise<Buffer>;
}

export class NodeAzRunner implements CommandRunner {
  async run(args: readonly string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync("az", [...args], {
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      });
      return stdout;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw new AzdoAxiError(
          "Azure CLI is not installed or is not on PATH.",
          "AZ_CLI_UNAVAILABLE",
          [
            "Install Azure CLI: https://learn.microsoft.com/cli/azure/install-azure-cli",
          ],
        );
      }
      throw error;
    }
  }

  async runBinary(args: readonly string[]): Promise<Buffer> {
    try {
      const { stdout } = await execFileAsync("az", [...args], {
        encoding: "buffer",
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true,
      });
      return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw new AzdoAxiError(
          "Azure CLI is not installed or is not on PATH.",
          "AZ_CLI_UNAVAILABLE",
          [
            "Install Azure CLI: https://learn.microsoft.com/cli/azure/install-azure-cli",
          ],
        );
      }
      throw error;
    }
  }
}

export interface AzureDevOpsPreflight {
  defaults: unknown;
}

export async function preflightAzureDevOps(
  runner: CommandRunner,
  defaultsNeeded = true,
): Promise<AzureDevOpsPreflight> {
  try {
    await runner.run(["--version"]);
  } catch (error) {
    if (error instanceof AzdoAxiError) {
      throw error;
    }
    throw new AzdoAxiError(
      "Azure CLI could not be executed.",
      "AZ_CLI_UNAVAILABLE",
      [
        "Run `az --version` and repair the Azure CLI installation before retrying.",
      ],
    );
  }

  try {
    await runner.run([
      "extension",
      "show",
      "--name",
      "azure-devops",
      "--only-show-errors",
      "--output",
      "json",
    ]);
  } catch {
    throw new AzdoAxiError(
      "The Azure DevOps Azure CLI extension is not installed or enabled.",
      "AZ_DEVOPS_EXTENSION_UNAVAILABLE",
      ["Install it with `az extension add --name azure-devops` and retry."],
    );
  }

  if (!defaultsNeeded) {
    return { defaults: {} };
  }

  try {
    const output = await runner.run([
      "devops",
      "configure",
      "--list",
      "--only-show-errors",
      "--output",
      "json",
    ]);
    return { defaults: parseDefaults(output) };
  } catch (error) {
    if (error instanceof AzdoAxiError) {
      throw error;
    }
    throw new AzdoAxiError(
      "The Azure DevOps Azure CLI extension is installed but could not be used.",
      "AZ_DEVOPS_EXTENSION_UNUSABLE",
      ["Run `az devops configure --list` to verify the extension, then retry."],
    );
  }
}

function parseDefaults(output: string): unknown {
  try {
    return JSON.parse(output);
  } catch {
    return parseIniDefaults(output);
  }
}

function parseIniDefaults(output: string): unknown {
  const values: Array<{ name: string; value: string }> = [];
  let foundDefaults = false;
  let inDefaults = false;

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const section = /^\[([^\]]+)\]$/.exec(trimmed);
    if (section) {
      if (section[1] === "defaults") {
        if (foundDefaults) {
          throw invalidDefaultsOutput();
        }
        foundDefaults = true;
        inDefaults = true;
      } else {
        inDefaults = false;
      }
      continue;
    }

    if (!foundDefaults || !inDefaults) {
      throw invalidDefaultsOutput();
    }

    const setting = /^([^=\s][^=]*?)\s*=\s*(\S(?:.*\S)?)$/.exec(trimmed);
    if (!setting) {
      throw invalidDefaultsOutput();
    }

    const key = setting[1].trim();
    const value = setting[2].trim();
    if (["organization", "project", "team", "iteration"].includes(key)) {
      values.push({ name: `defaults.${key}`, value });
    }
  }

  if (!foundDefaults) {
    throw invalidDefaultsOutput();
  }
  return values;
}

function invalidDefaultsOutput(): AzdoAxiError {
  return new AzdoAxiError(
    "Azure DevOps CLI defaults did not return supported JSON or INI output.",
    "AZ_CLI_INVALID_OUTPUT",
    ["Update Azure CLI and the azure-devops extension, then retry."],
  );
}
