## Why

`work-item update` currently sends common Azure DevOps fields through `--fields`, so Azure CLI does not apply standard options such as `--state`. When Azure CLI rejects the request, discarded stderr leaves callers with an opaque generic failure instead of the actionable cause.

## What Changes

- Construct native Azure CLI update options for state, title, description, assignee, area, and iteration.
- Keep `--fields` for validated custom Azure DevOps field reference names only.
- Preserve read-before-update, no-op detection, context resolution, validation, and normalized mutation output.
- Include safe Azure CLI stderr details in normalized request failures while retaining actionable error codes and suggestions.
- Add regression coverage for standard and custom argument construction, no-op updates, successful state updates, and the reported update path where feasible.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-mutations`: Standard update options use Azure CLI native flags and failed Azure requests expose safe diagnostic details.

## Impact

- `src/work-items.ts` update argument construction and Azure error normalization.
- Work-item mutation regression tests and the corresponding delta specification.
- No public command syntax changes or new dependencies.
