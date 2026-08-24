## Context

See `proposal.md` for the user-visible problem. Update options are normalized to Azure DevOps reference names before the update payload is built, and the existing read-before-update flow compares those normalized values. The command runner exposes Azure CLI failures as errors that may include a `stderr` property.

## Goals / Non-Goals

**Goals:**

- Translate the six supported standard update field references to Azure CLI native update flags.
- Emit custom assignments through `--fields` while retaining reference-name validation.
- Preserve the existing update lifecycle and normalized result contract.
- Surface bounded, sanitized Azure CLI diagnostics without exposing credentials.

**Non-Goals:**

- Changing command-line option names or context resolution.
- Replacing Azure CLI with direct Azure DevOps API calls.
- Changing create payload construction or adding support for new work-item fields.

## Decisions

- **Map at update argument construction.** Keep `mutationFields` and no-op comparison keyed by Azure DevOps reference names, then translate recognized names in `buildUpdateWorkItemArgs`. This keeps validation and comparison consistent while making the external Azure CLI invocation explicit.
- **Use an allowlist for native fields.** `System.Title`, `System.Description`, `System.State`, `System.AssignedTo`, `System.AreaPath`, and `System.IterationPath` map to their documented native flags. All remaining validated assignments, including tags and parent fields that do not have one of those native flags, remain in `--fields`; custom assignments are never silently converted.
- **Preserve deterministic argument grouping.** Emit native flag/value pairs in requested field order, followed by one `--fields` group for remaining custom assignments. This keeps command construction easy to inspect and avoids a generic `--fields` group for native fields.
- **Sanitize stderr before adding it to errors.** Use only the runner's stderr, remove terminal control sequences and line breaks, redact credential-shaped values, and cap the detail length. Retain existing error classification and suggestions, appending diagnostics to the user-facing message only when stderr is available.

## Risks / Trade-offs

- [Risk] Azure CLI stderr may contain sensitive or very long content → Strip control characters, redact common credential forms, and cap the diagnostic detail.
- [Risk] A future Azure CLI version changes native flag support → Keep the native mapping isolated and covered by direct argument-construction tests.
- [Risk] Azure responses may omit fields after a successful mutation → Continue using the existing normalized result and fallback ID behavior.

## Migration Plan

No data migration is required. Deploy the wrapper code and regression tests together; rollback is a code rollback if the installed Azure CLI version does not support the native flags.
