## Why

Attachment downloads currently capture Azure CLI stdout before writing it locally. Azure CLI can format command output, which can alter or reject non-JSON attachment bytes.

## What Changes

- Send validated attachment download responses directly to the selected local file through Azure CLI's binary-safe output-file support.
- Retain the 64 MiB guard, request scope, structured error handling, and credential redaction without returning attachment bytes in structured output.
- Add mocked coverage for the output-file download path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-evidence-inspection`: Ensure explicit attachment downloads preserve supported binary response bytes through a binary-safe file output path.

## Impact

- Affects the Azure command runner and work-item attachment download implementation.
- Updates attachment download regression coverage.
