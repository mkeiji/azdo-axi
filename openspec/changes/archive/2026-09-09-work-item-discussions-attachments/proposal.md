## Why

Work-item fields and links omit the discussion comments and attachments that often contain reproduction evidence. Read-only assessment needs bounded access to that evidence without exposing credentials or attachment bytes in command output.

## What Changes

- Add read-only commands to list work-item discussion comments and attachment metadata.
- Add an explicit, validated attachment download command that writes bytes only to a caller-selected local destination.
- Preserve Azure DevOps continuation behavior, compact structured output, existing context validation, and bounded text defaults.
- Document safe evidence-inspection workflows and add mocked contract coverage.

## Capabilities

### New Capabilities

- `work-item-evidence-inspection`: Read work-item comments and attachment metadata, and explicitly download validated attachment content to a local path.

### Modified Capabilities

- `work-item-read`: Extend read-only work-item command behavior and bounded output rules for evidence-inspection routes.

## Impact

Affected CLI parsing and help, Azure DevOps request handling, work-item output normalization, tests, and README usage documentation. No write operations, token handling, or attachment binary structured output are introduced.
