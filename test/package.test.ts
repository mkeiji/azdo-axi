import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
let tarball: string | undefined;
let installationDirectory: string | undefined;

afterEach(() => {
  if (tarball) {
    rmSync(tarball, { force: true });
    tarball = undefined;
  }
  if (installationDirectory) {
    rmSync(installationDirectory, { force: true, recursive: true });
    installationDirectory = undefined;
  }
});

describe("package artifact", () => {
  it("builds and installs the declared binary from a clean package", () => {
    rmSync(join(projectRoot, "dist"), { force: true, recursive: true });

    const packed = JSON.parse(
      execFileSync(npm, ["pack", "--json"], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
      }),
    ) as Array<{ filename: string }>;
    tarball = join(projectRoot, packed[0].filename);

    installationDirectory = mkdtempSync(join(tmpdir(), "azdo-axi-package-"));
    writeFileSync(
      join(installationDirectory, "package.json"),
      '{"private":true}',
    );
    execFileSync(npm, ["install", "--ignore-scripts", tarball], {
      cwd: installationDirectory,
      stdio: ["ignore", "ignore", "inherit"],
    });

    const binary = join(
      installationDirectory,
      "node_modules",
      ".bin",
      process.platform === "win32" ? "azdo-axi.cmd" : "azdo-axi",
    );
    expect(
      execFileSync(binary, ["--version"], { encoding: "utf8" }).trim(),
    ).toBe("0.1.0");
    expect(readFileSync(tarball).length).toBeGreaterThan(0);
  }, 30_000);
});
