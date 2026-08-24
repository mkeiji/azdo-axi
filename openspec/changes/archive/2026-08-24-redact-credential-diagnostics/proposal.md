## Why

The stderr diagnostics added for Azure CLI failures can still expose credentials when Azure CLI or an underlying HTTP error prints bearer headers, JSON access-token properties, or credential assignments. The existing bounded diagnostics contract must remain useful without leaking those values.

## What Changes

- Expand stderr redaction for authorization bearer tokens, JSON `accessToken`-style values, and credential-key assignments such as `client_secret`.
- Preserve existing diagnostic normalization, length bound, and actionable Azure error classification.
- Add regression coverage for each credential format and the existing bounded behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-mutations`: Require safe redaction of common credential forms in bounded Azure CLI stderr diagnostics.

## Impact

Affects the stderr sanitizer and mutation error tests in `src/work-items.ts` and `test/work-items.test.ts`. No public command options, dependencies, Azure request construction, or context behavior change.
