## Why

Two remaining `az boards work-item show` call sites still pass `--project`, which current Azure CLI rejects. This prevents update pre-reads and link inspection from reaching their intended read behavior even though the standalone show route was corrected.

## What Changes

- Make the update pre-read explicitly omit `--project` while preserving read-before-update, no-op detection, context resolution, and normalized output.
- Remove `--project` only from the Azure CLI show command used by `work-item links`.
- Preserve resolved project context in wrapper output and retain supported project arguments on create, list, and query.
- Add focused regression coverage for show-based command construction and guards for supported project arguments.
- Record route-by-route Azure CLI compatibility verification before changing any further arguments.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-read`: All show-based reads use supported Azure CLI arguments while preserving project context in wrapper output; create, list, and query retain their supported project arguments.
- `work-item-links`: Link inspection omits the unsupported project option from its `az boards work-item show` request.
- `work-item-mutations`: Update pre-reads use the supported show argument shape without changing read-before-update or mutation behavior.

## Impact

Affected implementation is the shared work-item read helper and the link route in `src/work-items.ts`, with focused argv and output tests in `test/work-items.test.ts`. No public context options, dependencies, or unrelated Azure route behavior changes.
