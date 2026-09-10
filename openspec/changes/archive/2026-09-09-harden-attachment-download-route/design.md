## Context

Attachment downloads already validate the selected work-item relation and reconstruct an Azure DevOps request. The request currently omits the resolved project route parameter, and generic Azure diagnostic sanitization does not cover every assignment-style credential form.

## Goals / Non-Goals

**Goals:**

- Scope reconstructed attachment requests to the resolved project.
- Ensure attachment download diagnostics retain their error classification and recovery guidance without exposing credential-like values.

**Non-Goals:**

- Add date filtering or live Azure DevOps verification.
- Change attachment download size, media-type, or filesystem behavior.

## Decisions

- Add `project=<resolved project>` alongside `attachmentId` in the attachment route parameters. This uses the already-resolved target rather than accepting a caller-provided project.
- Extend the shared Azure error-detail sanitizer so attachment-download normalization receives redacted details while retaining its existing structured error code and suggestions. This avoids a second, inconsistent diagnostic path.

## Risks / Trade-offs

- Overbroad redaction can remove useful diagnostics → redact only values following credential-like labels while retaining the label and existing actionable guidance.
- Azure CLI route expectations vary by resource → cover the exact generated route-parameter array with a mocked test.
