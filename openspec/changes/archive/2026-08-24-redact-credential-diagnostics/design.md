## Context

The mutation layer appends a normalized, bounded excerpt of Azure CLI stderr to classified errors. The current sanitizer strips terminal sequences, masks URL userinfo, and masks a limited set of unquoted key/value credentials, but does not cover bearer authorization headers, JSON token properties, or underscored credential names.

## Goals / Non-Goals

**Goals:**

- Mask the credential formats identified by the PR review before diagnostics are appended.
- Keep whitespace normalization and the existing 500-character diagnostic limit unchanged.
- Avoid broad changes to error classification or command execution.

**Non-Goals:**

- Implementing a general parser or secret-detection engine.
- Changing which stderr text is surfaced aside from credential masking.
- Altering Azure CLI arguments, context resolution, or mutation output.

## Decisions

- Extend the existing ordered regular-expression sanitizer rather than introducing a dependency or changing its return contract. This is the smallest correction at the existing trust boundary.
- Add patterns for `Authorization: Bearer <value>`, JSON-style `accessToken`/`access_token` properties (including quoted values), and broader credential keys including `client_secret`. Replace only the value while retaining the key/header shape for actionable diagnostics.
- Apply redaction before whitespace collapsing and length truncation, preserving the current bounded output behavior. Tests will assert that representative secrets never appear and that long diagnostics remain bounded.

## Risks / Trade-offs

- [Risk] Credential formats vary → Cover the reviewed forms and common key spelling variants without claiming complete secret detection.
- [Risk] Regex matching can over- or under-match malformed text → Keep patterns value-oriented, bounded to non-whitespace or quoted JSON values, and regression-test representative forms.

## Migration Plan

No migration is required. Deploy the sanitizer and tests together; rollback is a code rollback if diagnostic formatting proves problematic.
