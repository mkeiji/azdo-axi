## Why

The read-only work-item commands expose common list and detail views, but callers still lack a safe escape hatch for arbitrary WIQL and a focused way to inspect parent, child, and related links. Adding these read-only routes completes the issue-tracking query surface without expanding into unrelated Azure DevOps services.

## What Changes

- Add `azdo-axi query --wiql <query>` for raw WIQL queries scoped to the resolved organization and project.
- Add `azdo-axi work-item links <id>` to retrieve and normalize parent, child, and related-item relationships.
- Preserve custom work-item types and custom fields where Azure returns them, while retaining bounded output and existing normalized errors.
- Reuse context resolution, structured Azure CLI calls, explicit scopes/counts, and TOON boundary formatting from existing read-only commands.
- Reject unsupported flags locally and provide actionable suggestions for Azure failures.

## Capabilities

### New Capabilities

- `wiql-query`: Execute an advanced raw-WIQL query and return scoped, normalized results.
- `work-item-links`: Inspect and map parent, child, and related work-item links.

### Modified Capabilities

- `work-item-read`: Extend the existing read-only work-item surface with link inspection and preserve custom fields in normalized output where practical.

## Impact

Affected CLI argument routing, work-item query/normalization modules, Azure DevOps Boards CLI invocation, tests, README command documentation, and OpenSpec specifications. No new runtime dependencies or write operations are introduced.
