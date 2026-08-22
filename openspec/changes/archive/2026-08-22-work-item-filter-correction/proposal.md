## Why

The initial read-only work-item implementation passes iteration and area options to `az boards work-item list`, but those options are not supported by the Azure DevOps CLI command. Filtering must use the supported WIQL query route so scoped reads work against Azure DevOps rather than failing at runtime.

## What Changes

- Replace list requests that depend on unsupported `work-item list` iteration/area flags with `az boards query --wiql` requests.
- Build WIQL predicates for active Tasks plus explicit assignee, iteration, and area filters, while retaining resolved organization, project, team, and iteration scope in output.
- Preserve concise list normalization and fetch/normalize list fields from supported query results.
- Update regression tests for explicit iteration and area filtering and the supported Azure argv shape.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-read`: Require supported WIQL-backed list filtering for active Tasks, assignee, iteration, and area paths.

## Impact

Affected `src/work-items.ts`, work-item read tests, and the read capability delta. Show behavior, context resolution, output formatting, and read-only/authentication boundaries remain unchanged.
