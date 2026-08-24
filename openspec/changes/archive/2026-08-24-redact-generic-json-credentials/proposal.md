## Why

The bounded Azure CLI stderr diagnostic path still returns secrets when generic credential properties are formatted as quoted JSON keys, such as `{"token":"..."}` or `{"password":"..."}`. This is a security defect in the diagnostic trust boundary and needs a focused correction without changing error classification or request behavior.

## What Changes

- Extend credential redaction to cover generic quoted JSON credential properties, including token and password values.
- Preserve the existing redaction behavior for bearer headers, token-specific JSON properties, URL credentials, and assignment-style credentials.
- Add regression coverage that reproduces the reviewed leak and verifies proven sanitization paths remain safe.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-mutations`: Require generic quoted JSON credential properties to be redacted in Azure CLI diagnostics.

## Impact

Affects the Azure CLI stderr sanitizer and work-item mutation tests. No command arguments, public APIs, error codes, dependencies, or Azure context handling change.
