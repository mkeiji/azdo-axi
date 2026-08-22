## Why

Azure DevOps permission failures can include phrases such as “does not exist” or “not found,” and the current normalization checks those ambiguous phrases first. This incorrectly reports a missing resource instead of a permission problem and gives the wrong remediation.

## What Changes

- Classify permission and authorization indicators before ambiguous not-found wording.
- Treat combined does-not-exist-or-no-permission messages as permission failures.
- Preserve existing error codes and actionable suggestions for genuine not-found errors.
- Add regression tests for permission-only and combined Azure failure messages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-read`: Require permission-specific Azure error normalization to take precedence over ambiguous not-found wording.

## Impact

Affected Azure error normalization and work-item read tests only. Request construction, filtering, output, and existing error codes remain unchanged.
