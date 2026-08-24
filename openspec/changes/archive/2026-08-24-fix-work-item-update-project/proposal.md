## Why

`azdo-axi work-item update` currently forwards the resolved project to Azure CLI's `az boards work-item update`, but the current command rejects that unsupported option. This prevents otherwise valid updates, including state changes, from completing.

## What Changes

- Remove the `--project <project>` argument pair from the Azure argv generated for `work-item update`.
- Preserve context resolution and the project in the wrapper's normalized result and error context.
- Preserve the update route's read-before-update, field validation, no-op detection, result normalization, and error handling.
- Add regression coverage for the corrected update argv and successful state-update response handling.
- Keep project arguments unchanged for create, list, query, and any other Azure routes that support them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-mutations`: Update operations must use the supported Azure CLI argument set while retaining existing mutation behavior and output.
- `work-item-read`: The shared Azure argument contract must distinguish update, which does not support `--project`, from routes that do.

## Impact

The change is limited to the work-item update argument builder, its regression tests, and OpenSpec artifacts. No public wrapper options, dependencies, context resolution logic, or unrelated Azure routes change.
