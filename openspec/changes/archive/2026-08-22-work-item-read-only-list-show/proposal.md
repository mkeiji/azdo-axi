## Why

Agents need a safe, read-only way to inspect Azure DevOps work items without parsing human-oriented Azure CLI output or risking interactive behavior. This change delivers the first useful Boards data operations on top of the existing deterministic context boundary.

## What Changes

- Add `work-item list` and `work-item show <id>` operations backed by structured Azure CLI JSON.
- Add context-aware list filtering for active tasks assigned to a user, iteration, and area path.
- Emit concise TOON responses with explicit scope, context, counts, useful detail fields, truncation metadata, and normalized actionable failures.
- Validate all operation flags before any Azure request and keep reads non-interactive and token-free.
- Add unit tests for filtering, formatting, truncation, empty results, flag validation, and Azure failures.

## Capabilities

### New Capabilities

- `work-item-read`: Read-only work-item listing and detail inspection with safe structured output.

### Modified Capabilities

- `cli-context-resolution`: Extend the existing routed command surface from context preflight to read-only work-item operations while preserving deterministic context and option safety.

## Impact

Affected TypeScript CLI routing, argument parsing, Azure CLI adapter, TOON boundary formatting, tests, README, and the main CLI-context specification. No new runtime dependency is required beyond the existing TOON formatter and Azure CLI/azure-devops extension.
