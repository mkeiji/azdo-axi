## Why

`work-item create --parent <id>` currently accepts and sends the parent as a field, but Azure DevOps can create the item without persisting the hierarchy relation. This leaves an orphaned work item while the command reports success.

## What Changes

- Persist a requested parent through the Azure DevOps hierarchy relation operation after creation.
- Read back the created item with relationships expanded and verify the requested parent relation or parent field before returning success.
- Preserve the existing no-parent create path, validation, context resolution, output shape, and normalized error handling.
- Add offline regression coverage for relation mutation, verification, no-parent creation, and failure handling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-mutations`: A create request with `--parent` must persist and verify the hierarchy relation before reporting success.

## Impact

Affects the work-item creation orchestration and its Azure CLI argv construction in `src/work-items.ts`, related mutation tests, and the create behavior contract. The implementation adds one relation mutation and one verification read only when a parent is requested.
