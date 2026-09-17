## Why

Azure DevOps discussion responses and attachment retrieval have diverged from the installed CLI contract, preventing reliable inspection of work-item evidence and creating unsafe download edge cases. This change makes comments and attachment evidence bounded, validated, read-only, and useful for inline comment images.

## What Changes

- Request comments through the Azure CLI-compatible `7.1-preview` API and normalize live and legacy envelopes with bounded pagination and deduplication.
- Inventory supported inline comment images as metadata without downloading bytes.
- Harden relation attachment downloads with validated temporary staging, atomic no-clobber publication, cleanup, and content/URL safety checks.
- Add scoped, allowlisted, size-bounded evidence validation and regression coverage.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `work-item-evidence-inspection`: Update comments transport, inline-image metadata, and validated attachment download behavior.

## Impact

Affected `src/work-items.ts`, Azure command runner integration, CLI evidence output, tests, and the work-item evidence specification. No write APIs or external dependencies are introduced.
