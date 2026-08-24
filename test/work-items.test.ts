import { describe, expect, it } from "vitest";

import type { CommandRunner } from "../src/az.js";
import { parseInvocation } from "../src/arguments.js";
import {
  buildCreateWorkItemArgs,
  buildListWiql,
  buildUpdateWorkItemArgs,
  createWorkItem,
  detailItem,
  linkRelations,
  linkWorkItem,
  listWorkItems,
  normalizeAzureError,
  queryWorkItems,
  showWorkItem,
  updateWorkItem,
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

function runnerForSequence(
  outputs: unknown[],
  calls: string[][],
): CommandRunner {
  return {
    run: async (args) => {
      calls.push([...args]);
      const output = outputs.shift();
      if (output === undefined) {
        throw new Error("Unexpected command invocation");
      }
      return JSON.stringify(output);
    },
  };
}

describe("work-item mutations", () => {
  it("builds a task create payload with parent, common, and custom fields", () => {
    const args = buildCreateWorkItemArgs(context, {
      workItemType: "Task",
      title: "Ship it",
      description: "Do the thing",
      parent: "41",
      iteration: "Product\\Sprint 2",
      assignee: "Ada",
      fields: { "Custom.Risk": "high" },
    });
    expect(args).toEqual(
      expect.arrayContaining([
        "boards",
        "work-item",
        "create",
        "--type",
        "Task",
        "--title",
        "Ship it",
        "--fields",
        "System.Description=Do the thing",
        "System.Parent=41",
        "System.IterationPath=Product\\Sprint 2",
        "System.AssignedTo=Ada",
        "Custom.Risk=high",
        "--organization",
        context.organization,
        "--project",
        context.project,
        "--output",
        "json",
      ]),
    );
  });

  it("updates a bug and returns the resulting target envelope", async () => {
    const calls: string[][] = [];
    const result = await updateWorkItem(
      runnerForSequence(
        [
          {
            id: 9,
            fields: {
              "System.WorkItemType": "Bug",
              "System.Title": "Broken",
              "System.State": "Active",
              "System.Tags": "old",
            },
          },
          {
            id: 9,
            fields: {
              "System.WorkItemType": "Bug",
              "System.Title": "Broken",
              "System.State": "Resolved",
              "System.Tags": "security; urgent",
              "System.AssignedTo": { displayName: "Ada" },
            },
          },
        ],
        calls,
      ),
      context,
      "9",
      { state: "Resolved", tags: "security; urgent", assignee: "Ada" },
    );
    expect(result).toMatchObject({
      organization: context.organization,
      project: context.project,
      workItemId: 9,
      operation: "update",
      noOp: false,
      state: "Resolved",
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual(
      expect.arrayContaining([
        "boards",
        "work-item",
        "show",
        "--id",
        "9",
        "--organization",
        context.organization,
        "--expand",
        "relations",
        "--output",
        "json",
      ]),
    );
    expect(calls[0]).not.toContain("--project");
    expect(calls[1]).toEqual([
      "boards",
      "work-item",
      "update",
      "--id",
      "9",
      "--assigned-to",
      "Ada",
      "--state",
      "Resolved",
      "--fields",
      "System.Tags=security; urgent",
      "--organization",
      context.organization,
      "--output",
      "json",
      "--only-show-errors",
    ]);
    expect(calls[1]).not.toContain("--project");
  });

  it("builds native standard update flags and keeps custom fields under --fields", () => {
    const args = buildUpdateWorkItemArgs(context, "314701", {
      "System.Title": "Updated title",
      "System.Description": "Updated description",
      "System.State": "Active",
      "System.AssignedTo": "Ada",
      "System.AreaPath": "Product\\Frontend",
      "System.IterationPath": "Product\\Sprint 2",
      "Custom.Risk": "high",
    });

    expect(args).toEqual([
      "boards",
      "work-item",
      "update",
      "--id",
      "314701",
      "--title",
      "Updated title",
      "--description",
      "Updated description",
      "--state",
      "Active",
      "--assigned-to",
      "Ada",
      "--area",
      "Product\\Frontend",
      "--iteration",
      "Product\\Sprint 2",
      "--fields",
      "Custom.Risk=high",
      "--organization",
      context.organization,
      "--output",
      "json",
      "--only-show-errors",
    ]);
  });

  it("returns a safe no-op without issuing an update", async () => {
    const calls: string[][] = [];
    const result = await updateWorkItem(
      runnerFor(
        {
          id: 9,
          fields: {
            "System.State": "Resolved",
            "System.Tags": "urgent; security",
            "System.AssignedTo": { displayName: "Ada" },
          },
        },
        calls,
      ),
      context,
      "9",
      { state: "Resolved", tags: "security; urgent", assignee: "Ada" },
    );
    expect(result).toMatchObject({
      noOp: true,
      organization: context.organization,
      project: context.project,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).not.toContain("--project");
  });

  it("reproduces a successful state update for the reported work item path", async () => {
    const calls: string[][] = [];
    const result = await updateWorkItem(
      runnerForSequence(
        [
          {
            id: 314701,
            fields: {
              "System.WorkItemType": "Task",
              "System.Title": "Reported item",
              "System.State": "New",
            },
          },
          {
            id: 314701,
            fields: {
              "System.WorkItemType": "Task",
              "System.Title": "Reported item",
              "System.State": "Active",
            },
          },
        ],
        calls,
      ),
      context,
      "314701",
      { state: "Active" },
    );

    expect(result).toMatchObject({
      workItemId: 314701,
      state: "Active",
      noOp: false,
    });
    expect(calls[1]).toEqual(
      expect.arrayContaining(["--id", "314701", "--state", "Active"]),
    );
    expect(calls[1]).not.toContain("--fields");
  });

  it("rejects invalid mutation payloads before Azure writes", () => {
    expect(() => parseInvocation("work-item", ["delete", "9"])).toThrow(
      "requires one of: list, show, create, update, links",
    );
    expect(() =>
      buildCreateWorkItemArgs(context, {
        workItemType: "Task",
        title: "Bad parent",
        parent: "not-an-id",
      }),
    ).toThrow("Parent work-item ID must be a positive integer");
    expect(() =>
      parseInvocation("work-item", [
        "create",
        "--type",
        "Task",
        "--title",
        "Bad field",
        "--field",
        "not a reference=value",
      ]),
    ).toThrow("valid `Reference.Name=value` syntax");
    expect(() =>
      buildUpdateWorkItemArgs(context, "7", { "not a reference": "value" }),
    ).toThrow("not a valid Azure DevOps reference name");
    expect(() => buildUpdateWorkItemArgs(context, "7", {})).toThrow(
      "At least one update field is required",
    );
  });

  it("preserves equals signs in custom field values", () => {
    const args = buildCreateWorkItemArgs(context, {
      workItemType: "CustomRequirement",
      title: "Expression",
      fields: { "Custom.Expression": "a=b=c" },
    });
    expect(args).toContain("Custom.Expression=a=b=c");
  });

  it("normalizes mutation authentication and permission failures", async () => {
    const runner: CommandRunner = {
      run: async () => Promise.reject(new Error("403 Forbidden")),
    };
    await expect(
      createWorkItem(runner, context, {
        workItemType: "Bug",
        title: "Cannot create",
      }),
    ).rejects.toMatchObject({ code: "AZ_PERMISSION_DENIED" });
  });

  it("includes bounded safe Azure CLI stderr details in request failures", () => {
    const error = normalizeAzureError(
      {
        message: "Command failed",
        stderr:
          "The field System.State is not recognized. token=super-secret " +
          "x".repeat(600),
      },
      "work-item update 314701",
    );

    expect(error).toMatchObject({ code: "AZ_BOARDS_REQUEST_FAILED" });
    expect(error.message).toContain(
      "The field System.State is not recognized.",
    );
    expect(error.message).toContain("token=[redacted]");
    expect(error.message).not.toContain("super-secret");
    expect(error.message.length).toBeLessThan(700);
  });

  it("redacts bearer, JSON token, and credential assignment diagnostics", () => {
    const secrets = ["bearer-secret", "json-secret", "underscored-secret"];
    const error = normalizeAzureError(
      {
        stderr:
          `Authorization: Bearer ${secrets[0]} ` +
          `{"accessToken":"${secrets[1]}", "access_token": "${secrets[1]}"} ` +
          `client_secret=${secrets[2]}`,
      },
      "work-item update 314701",
    );

    expect(error.message).toContain("Authorization: [redacted]");
    expect(error.message).toContain('"accessToken":"[redacted]"');
    expect(error.message).toContain('"access_token": "[redacted]"');
    expect(error.message).toContain("client_secret=[redacted]");
    for (const secret of secrets) {
      expect(error.message).not.toContain(secret);
    }
  });

  it("redacts generic quoted JSON credential properties", () => {
    const secrets = ["generic-token-secret", "generic-password-secret"];
    const error = normalizeAzureError(
      {
        stderr: `{"token":"${secrets[0]}", "password": "${secrets[1]}"}`,
      },
      "work-item update 314701",
    );

    expect(error.message).toContain('"token":"[redacted]"');
    expect(error.message).toContain('"password": "[redacted]"');
    for (const secret of secrets) {
      expect(error.message).not.toContain(secret);
    }
  });

  it("redacts quoted bearer token diagnostics", () => {
    const secret = "quoted-bearer-secret";
    const error = normalizeAzureError(
      {
        stderr: `Authorization: Bearer "${secret}"`,
      },
      "work-item update 314701",
    );

    expect(error.message).toContain("Authorization: [redacted]");
    expect(error.message).not.toContain(secret);
  });

  it("redacts Basic authorization credentials in diagnostics", () => {
    const secret = "dXNlcjpzdXBlci1zZWNyZXQ=";
    const error = normalizeAzureError(
      {
        stderr: `Authorization: Basic ${secret}`,
      },
      "work-item update 314701",
    );

    expect(error.message).toContain("Authorization: [redacted]");
    expect(error.message).not.toContain(secret);
  });
});

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

  it("uses supported arguments and preserves context when showing a work item", async () => {
    const calls: string[][] = [];
    const result = await showWorkItem(
      runnerFor(
        {
          id: 7,
          fields: {
            "System.Title": "Inspect",
          },
        },
        calls,
      ),
      context,
      "7",
      {},
    );

    expect(calls[0]).toEqual([
      "boards",
      "work-item",
      "show",
      "--id",
      "7",
      "--organization",
      context.organization,
      "--expand",
      "relations",
      "--output",
      "json",
      "--only-show-errors",
    ]);
    expect(result).toMatchObject({
      context,
      item: { id: 7, title: "Inspect" },
    });
  });

  it("executes raw WIQL and preserves custom fields and scope", async () => {
    const calls: string[][] = [];
    const result = await queryWorkItems(
      runnerFor(
        [
          {
            id: 17,
            url: "https://dev.azure.com/example/_apis/wit/workItems/17",
            fields: {
              "System.WorkItemType": "CustomRequirement",
              "System.Title": "A custom item",
              "Custom.Risk": "high",
            },
          },
        ],
        calls,
      ),
      context,
      "SELECT [System.Id], [Custom.Risk] FROM WorkItems",
    );
    expect(result).toMatchObject({
      scope: {
        organization: context.organization,
        project: context.project,
        team: context.team,
      },
      count: 1,
      items: [
        {
          id: 17,
          type: "CustomRequirement",
          fields: { "Custom.Risk": "high" },
        },
      ],
    });
    expect(calls[0]).toEqual(
      expect.arrayContaining([
        "boards",
        "query",
        "--wiql",
        "SELECT [System.Id], [Custom.Risk] FROM WorkItems",
        "--organization",
        context.organization,
        "--project",
        context.project,
        "--output",
        "json",
      ]),
    );
  });

  it("reports an explicit empty query result and applied scope", async () => {
    const result = await queryWorkItems(
      runnerFor([], []),
      context,
      "SELECT [System.Id] FROM WorkItems WHERE [System.Id] = 999999",
    );
    expect(result).toMatchObject({
      count: 0,
      scope: {
        organization: context.organization,
        project: context.project,
        wiql: "SELECT [System.Id] FROM WorkItems WHERE [System.Id] = 999999",
      },
    });
  });

  it("maps parent, child, related, and unknown links", () => {
    expect(
      linkRelations([
        {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: "https://dev.azure.com/example/_apis/wit/workItems/1",
        },
        {
          rel: "System.LinkTypes.Hierarchy-Forward",
          url: "https://dev.azure.com/example/_apis/wit/workItems/2",
        },
        {
          rel: "System.LinkTypes.Related",
          url: "https://dev.azure.com/example/_apis/wit/workItems/3",
        },
        { rel: "System.LinkTypes.Dependency-Forward", url: "custom-url" },
      ]),
    ).toMatchObject([
      { category: "parent", targetId: "1" },
      { category: "child", targetId: "2" },
      { category: "related", targetId: "3" },
      { category: "other", url: "custom-url" },
    ]);
  });

  it("returns empty links and custom source fields without a project show argument", async () => {
    const calls: string[][] = [];
    const result = await linkWorkItem(
      runnerFor(
        {
          id: 7,
          fields: {
            "System.WorkItemType": "CustomRequirement",
            "Custom.Risk": "high",
          },
        },
        calls,
      ),
      context,
      "7",
    );
    expect(calls[0]).toEqual([
      "boards",
      "work-item",
      "show",
      "--id",
      "7",
      "--organization",
      context.organization,
      "--expand",
      "relations",
      "--output",
      "json",
      "--only-show-errors",
    ]);
    expect(result).toMatchObject({
      workItemId: "7",
      count: 0,
      links: [],
      item: { fields: { "Custom.Risk": "high" } },
      context,
      scope: { project: context.project },
    });
  });

  it("normalizes link lookup failures as work-item failures", async () => {
    const runner: CommandRunner = {
      run: async () => Promise.reject(new Error("work item 7 not found")),
    };
    await expect(linkWorkItem(runner, context, "7")).rejects.toMatchObject({
      code: "WORK_ITEM_NOT_FOUND",
      suggestions: [expect.stringContaining("work-item ID")],
    });
  });
});
