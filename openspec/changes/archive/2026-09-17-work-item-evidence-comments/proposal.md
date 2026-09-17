## Why

Azure DevOps discussion responses and evidence downloads have drifted from the installed CLI API contract, causing missing comments and unsafe attachment handling. Inline comment images also need inspectable metadata without making listing network downloads.

## What Changes

- Normalize comments envelopes and use the installed 7.1-preview API version with bounded and explicit pagination.
- Inventory inline image references from comment HTML and gate later downloads on fresh, scoped listing data.
- Make relation downloads atomic and no-clobber with temporary output, cleanup, media/content validation, and strict URL scoping.
- Add regression coverage for transport, pagination, extraction, safety, validation, and redaction.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `openspec/specs/work-item-evidence-inspection/`: strengthen comments normalization, inline image metadata, and safe attachment download requirements.

## Impact

Affected `src/work-items.ts`, evidence command tests, and the work-item evidence inspection specification. No write APIs or external dependencies are introduced.
