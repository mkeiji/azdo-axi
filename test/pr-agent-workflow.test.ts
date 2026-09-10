import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workflowsDirectory = join(projectRoot, ".github", "workflows");

describe("pull-request automation", () => {
  it("does not include the removed PR Agent workflow", () => {
    expect(existsSync(join(workflowsDirectory, "pr-agent.yml"))).toBe(false);

    for (const workflow of readdirSync(workflowsDirectory)) {
      const contents = readFileSync(join(workflowsDirectory, workflow), "utf8");
      expect(contents).not.toContain("the-pr-agent/pr-agent");
    }
  });
});
