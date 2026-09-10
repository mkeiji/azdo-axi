## Context

See proposal.md for motivation. The attachment route currently captures `az devops invoke` stdout in memory and writes that buffer after the command exits. Azure CLI output formatting is not a binary transport contract.

## Goals / Non-Goals

**Goals:**

- Delegate attachment response writes to Azure CLI's binary-safe output-file option.
- Preserve current relation validation, 64 MiB checks, error normalization, redaction, and compact metadata-only result.

**Non-Goals:**

- Add comment filtering, live Azure DevOps verification, or new download formats.

## Decisions

- Replace the runner's buffer-returning attachment operation with a file-targeted operation that invokes `az devops invoke` using `--out <destination>`. This uses the Azure DevOps extension's response-file handling instead of formatted stdout.
- Reserve the resolved destination before invoking Azure CLI, retaining the existing no-overwrite behavior. Remove the reserved file when the invocation fails or a post-download size check rejects it.
- Retain both the relation metadata preflight and a final file-size check against the existing 64 MiB limit. The preflight prevents known oversized files from being requested; the final check covers incomplete metadata.

## Risks / Trade-offs

- Azure CLI writes directly to a local file rather than an in-memory buffer → reserve a new destination first and retain structured write errors.
- Unknown attachment sizes can only be checked after Azure CLI completes → reject and remove an oversized output before returning structured metadata.
- The Azure CLI is not installed in mocked test environments → test the file-targeted runner contract rather than live CLI behavior.
