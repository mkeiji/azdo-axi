## Context

The existing list implementation invokes `az boards work-item list` with `--iteration` and `--area`, but those flags are not available on the supported Azure DevOps CLI command. The Azure DevOps extension provides `az boards query --wiql`, which accepts organization and project and can express the required work-item predicates.

## Goals / Non-Goals

**Goals:**

- Construct a deterministic WIQL query for active Task work items and optional assignee, iteration, and area predicates.
- Invoke the supported query route with argv values and JSON output, then retain the existing concise list mapping and scope metadata.
- Keep query construction safely escaped for WIQL string literals and test both filters.

**Non-Goals:**

- Changing the public list flags or show operation.
- Adding arbitrary WIQL input to the work-item list route.
- Changing context resolution, authentication, mutation routes, or output truncation behavior.

## Decisions

- **Use `az boards query` for list reads.** This is the supported Azure CLI path for iteration and area filtering; passing those flags to `az boards work-item list` is invalid. The query requests `System.Id`, `System.WorkItemType`, `System.Title`, `System.State`, and `System.AssignedTo`, which keeps list output concise while allowing the existing mapper to work.
- **Represent filters as WIQL predicates.** Active Task defaults are always included. Assignee maps to `[System.AssignedTo]`, iteration to `[System.IterationPath]`, and area to `[System.AreaPath]`; each value is escaped by doubling single quotes before insertion into the WIQL literal.
- **Preserve resolved context separately.** Organization and project are explicit query argv values. Team remains in the returned context/scope because WIQL has no equivalent team flag, and a resolved iteration remains the default iteration predicate unless explicitly overridden.
- **Treat query results as list items.** Azure CLI query results are expected to contain work-item records with `id` and `fields`; invalid non-array output continues to produce the existing normalized invalid-output error.

## Risks / Trade-offs

- [Azure CLI query result shape can vary by extension version] → Keep the existing normalized mapper and invalid-output handling; request the exact list fields explicitly.
- [WIQL string values can contain apostrophes] → Escape apostrophes according to WIQL literal rules and test the resulting argv query.
- [A query may return no rows] → Preserve count `0` and the full applied scope metadata already emitted by list results.
