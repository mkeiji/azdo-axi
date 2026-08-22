import { describe, expect, it } from "vitest";

import type { CommandRunner } from "../src/az.js";
import { parseInvocation } from "../src/arguments.js";
import {
  buildListWiql,
  detailItem,
  listWorkItems,
  normalizeAzureError,
  showWorkItem,
} from "../src/work-items.js";

const context = {
  organization: "https://dev.azure.com/example",
  project: "project",
  team: "team",
  iteration: "Sprint 1",
};

function runnerFor(output: unknown, calls: string[][]): CommandRunner {
  return {
    run: async (args) => (calls.push([...args]), JSON.stringify(output)),
  };
}

describe("work-item reads", () => {
  it("builds active task filters from explicit values and returns concise list fields", async () => {
    const calls: string[][] = [];
    const result = await listWorkItems(
      runnerFor(
        [
          {
            id: 42,
            fields: {
              "System.WorkItemType": "Task",
              "System.Title": "Ship it",
              "System.State": "Active",
              "System.AssignedTo": { displayName: "Ada" },
              "System.Description": "not in list",
            },
          },
        ],
        calls,
      ),
      context,
      { assignee: "Ada", iteration: "Sprint 2", area: "Product" },
    );

    expect(result).toEqual({
      context,
      scope: {
        organization: context.organization,
        project: context.project,
        team: "team",
        state: "Active",
        type: "Task",
        assignee: "Ada",
        iteration: "Sprint 2",
        area: "Product",
      },
      count: 1,
      items: [
        {
          id: 42,
          type: "Task",
          title: "Ship it",
          state: "Active",
          assignee: "Ada",
        },
      ],
    });
    expect(calls[0]?.slice(0, 2)).toEqual(["boards", "query"]);
    expect(calls[0]).toEqual(
      expect.arrayContaining([
        "--organization",
        context.organization,
        "--project",
        context.project,
        "--output",
        "json",
      ]),
    );
    const wiql = calls[0]?.[calls[0].indexOf("--wiql") + 1];
    expect(wiql).toContain("[System.WorkItemType] = 'Task'");
    expect(wiql).toContain("[System.State] = 'Active'");
    expect(wiql).toContain("[System.AssignedTo] = 'Ada'");
    expect(wiql).toContain("[System.IterationPath] = 'Sprint 2'");
    expect(wiql).toContain("[System.AreaPath] = 'Product'");
    expect(wiql).not.toContain("--iteration");
    expect(wiql).not.toContain("--area");
  });

  it("uses context iteration and reports empty results explicitly", async () => {
    const calls: string[][] = [];
    const result = await listWorkItems(runnerFor([], calls), context, {});
    expect(result.count).toBe(0);
    expect(result.scope).toMatchObject({
      iteration: "Sprint 1",
      state: "Active",
      type: "Task",
    });
    const wiql = calls[0]?.[calls[0].indexOf("--wiql") + 1];
    expect(wiql).toContain("[System.IterationPath] = 'Sprint 1'");
  });

  it("builds separate iteration and area WIQL predicates and escapes literals", () => {
    const wiql = buildListWiql({
      iteration: "Product\\Sprint O'Brien",
      area: "Product\\People's Tools",
    });
    expect(wiql).toContain(
      "[System.IterationPath] = 'Product\\Sprint O''Brien'",
    );
    expect(wiql).toContain("[System.AreaPath] = 'Product\\People''s Tools'");
    expect(wiql).not.toContain("work-item list");
  });

  it("maps details, estimates, tags, and relationships", () => {
    const result = detailItem({
      id: 7,
      fields: {
        "System.WorkItemType": "Task",
        "System.Title": "Inspect",
        "System.State": "Active",
        "System.AssignedTo": { uniqueName: "ada@example.test" },
        "System.AreaPath": "Product",
        "System.IterationPath": "Product\\Sprint 1",
        "System.Tags": "one; two",
        "Microsoft.VSTS.Scheduling.Effort": 3,
        "System.Description": "Short description",
        "Microsoft.VSTS.Common.AcceptanceCriteria": "Pass",
      },
      relations: [
        { rel: "System.LinkTypes.Related", url: "https://example.test/8" },
      ],
    });
    expect(result).toMatchObject({
      id: 7,
      assignee: "ada@example.test",
      area: "Product",
      iteration: "Product\\Sprint 1",
      tags: ["one", "two"],
      estimates: { effort: 3 },
      description: "Short description",
      acceptanceCriteria: "Pass",
      relationships: [{ type: "System.LinkTypes.Related" }],
    });
  });

  it("truncates large text by default and supports full output", () => {
    const description = "x".repeat(2_005);
    const item = { fields: { "System.Description": description } };
    const bounded = detailItem(item);
    expect(bounded.description).toHaveLength(2_000);
    expect(bounded.descriptionOriginalSize).toBe(2_005);
    expect(bounded.descriptionTruncated).toBe(true);
    expect(detailItem(item, true).description).toBe(description);
  });

  it("normalizes Azure failures into actionable structured errors", () => {
    expect(
      normalizeAzureError(new Error("403 Forbidden"), "work-item list"),
    ).toMatchObject({
      code: "AZ_PERMISSION_DENIED",
      suggestions: [expect.stringContaining("read")],
    });
    expect(
      normalizeAzureError(
        new Error("work item 9 not found"),
        "work-item show 9",
      ),
    ).toMatchObject({
      code: "WORK_ITEM_NOT_FOUND",
      suggestions: [expect.stringContaining("work-item ID")],
    });
  });

  it("prioritizes permission-only errors over not-found wording", () => {
    expect(
      normalizeAzureError(
        new Error("You do not have permission to view this work item"),
        "work-item show 9",
      ),
    ).toMatchObject({
      code: "AZ_PERMISSION_DENIED",
      suggestions: [expect.stringContaining("read")],
    });
  });

  it("prioritizes permission in combined does-not-exist messages", () => {
    expect(
      normalizeAzureError(
        new Error(
          "The work item does not exist or you have no permission to view it",
        ),
        "work-item show 9",
      ),
    ).toMatchObject({
      code: "AZ_PERMISSION_DENIED",
      suggestions: [expect.stringContaining("read")],
    });
  });

  it("rejects unsupported read flags locally", () => {
    expect(() =>
      parseInvocation("work-item", ["list", "--asignee", "Ada"]),
    ).toThrow("Unsupported option: --asignee");
    expect(() =>
      parseInvocation("work-item", ["show", "7", "--assignee", "Ada"]),
    ).toThrow("Unsupported option: --assignee");
  });

  it.each([
    ["Ada", "Ada"],
    ["Ada", "Grace"],
  ])("rejects conflicting assignee aliases (%s / %s)", (assignee, alias) => {
    expect(() =>
      parseInvocation("work-item", [
        "list",
        "--assignee",
        assignee,
        "--assigned-to",
        alias,
      ]),
    ).toThrow("Options --assignee and --assigned-to cannot be used together");
  });

  it.each([
    ["Product", "Product"],
    ["Product", "Platform"],
  ])("rejects conflicting area aliases (%s / %s)", (area, alias) => {
    expect(() =>
      parseInvocation("work-item", [
        "list",
        "--area",
        area,
        "--area-path",
        alias,
      ]),
    ).toThrow("Options --area and --area-path cannot be used together");
  });

  it("requests relations and JSON when showing a work item", async () => {
    const calls: string[][] = [];
    await showWorkItem(
      runnerFor({ id: 7, fields: {} }, calls),
      context,
      "7",
      {},
    );
    expect(calls[0]).toEqual(
      expect.arrayContaining(["--expand", "relations", "--output", "json"]),
    );
  });
});
