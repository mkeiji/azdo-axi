---
name: azdo-axi
description: Resolve and operate on an Azure DevOps Boards target with azdo-axi.
---

# Azure DevOps Boards with azdo-axi

Use `azdo-axi context` before delegating Azure DevOps Boards work. Supply
`--organization` and `--project` when the target is not already configured or
when an explicit target is required.

```sh
azdo-axi context --organization https://dev.azure.com/example --project example-project
```

The CLI uses existing Azure CLI and Azure DevOps extension authentication. Do
not provide, store, or print tokens. Commands are non-interactive and fail
instead of selecting an ambiguous organization or project.

## Reads

- `azdo-axi work-item list [--assignee <user>] [--iteration <path>] [--area <path>]`
- `azdo-axi work-item show <id> [--full]`
- `azdo-axi work-item links <id>`
- `azdo-axi query --wiql "..."` for advanced queries and custom fields

## Mutations

Create standard Azure DevOps types (including Epic, Feature, User Story, Task,
and Bug) or an explicitly named project-specific type:

```sh
azdo-axi work-item create --type Task --title "Implement parser" \
  --description "Add the parser" --parent 123 \
  --iteration "Project\\Sprint 1" --assignee user@example.com
```

Use repeatable `--field Reference.Name=value` options for custom fields. Update
an existing item with common fields such as state, tags, assignment, title,
description, iteration, and area:

```sh
azdo-axi work-item update 123 --state Resolved \
  --tags "customer; urgent" --assignee user@example.com
```

Updates read the item first. If every requested value is already present, the
command succeeds without a write and reports `noOp: true`. No delete route is
exposed.

## Compact output contract

Successful reads and mutations emit compact TOON. Mutation output includes
`operation`, `context`, top-level `organization`, `project`, `workItemId`,
`noOp`, and resulting `type`, `title`, and `state` when Azure returns them;
`item` contains normalized details and returned fields. Errors are structured
and actionable. The organization and project are always the resolved target;
the wrapper never silently changes them.
