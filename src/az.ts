import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { AzdoAxiError } from "./errors.js";

const execFileAsync = promisify(execFile);

export interface CommandRunner {
  run(args: readonly string[]): Promise<string>;
}

export class NodeAzRunner implements CommandRunner {
  async run(args: readonly string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync("az", [...args], {
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
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
}

export interface AzureDevOpsPreflight {
  defaults: unknown;
}

export async function preflightAzureDevOps(
  runner: CommandRunner,
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

  try {
    const output = await runner.run([
      "devops",
      "configure",
      "--list",
      "--only-show-errors",
      "--output",
      "json",
    ]);
    return { defaults: parseJson(output, "Azure DevOps CLI defaults") };
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

function parseJson(output: string, description: string): unknown {
  try {
    return JSON.parse(output);
  } catch {
    throw new AzdoAxiError(
      `${description} did not return JSON output.`,
      "AZ_CLI_INVALID_OUTPUT",
      ["Update Azure CLI and the azure-devops extension, then retry."],
    );
  }
}
