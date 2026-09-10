## Why

Attachment downloads must include the resolved project in the Azure DevOps route and must not expose credential-like values when Azure CLI reports a failure.

## What Changes

- Include the resolved project route parameter in validated attachment download requests.
- Redact token-like values from attachment download diagnostics while preserving structured error codes and recovery guidance.
- Add regression coverage for the route parameter and download-error redaction.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-evidence-inspection`: Require project-scoped attachment download requests and safe download diagnostics.

## Impact

- Updates attachment download request construction and Azure error-detail sanitization in `src/work-items.ts`.
- Adds mocked regression coverage in `test/work-items.test.ts`.
