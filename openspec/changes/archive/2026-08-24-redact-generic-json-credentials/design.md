## Context

See `proposal.md` for the reported security defect. `normalizeAzureError` appends a bounded, whitespace-normalized stderr excerpt after applying ordered regular-expression redactions. Existing patterns handle explicit token JSON properties and unquoted credential assignments, but the generic assignment pattern does not recognize a quoted JSON property name.

## Goals / Non-Goals

**Goals:**

- Redact generic quoted JSON credential properties before diagnostics reach the user-facing error.
- Keep existing safe diagnostic context, truncation, error classification, and all previously covered formats unchanged.
- Add tests that compare the failing quoted-property path with the already-proven assignment and explicit-token paths.

**Non-Goals:**

- Building a general JSON parser or secret-detection engine.
- Changing Azure CLI invocation, context handling, output normalization, or public command syntax.
- Expanding the diagnostic length or changing the set of error codes.

## Decisions

- Extend the existing sanitizer with a credential-key pattern that accepts optional quotes around the property name and value, rather than parsing arbitrary JSON. This is the smallest root-cause fix at the established boundary and avoids new dependencies.
- Keep the pattern value-oriented and limited to common credential names already covered by the assignment sanitizer. Preserve the key and JSON punctuation while replacing only the value with `[redacted]`, so safe failure context remains actionable.
- Apply the new pattern after the more specific token-property patterns and before whitespace normalization. The specific patterns retain their existing output shape, while the generic pattern closes the quoted-key gap.

## Risks / Trade-offs

- [Risk] Credential-bearing text can have formats not represented by the allowlist → Preserve the existing bounded behavior and cover the reviewed generic JSON forms without claiming complete secret detection.
- [Risk] A broad quoted-value match could redact benign diagnostic values → Limit matching to the established credential-key allowlist and redact only property values.
- [Risk] Regex ordering could expose a value or alter existing output → Regression-test generic JSON, explicit token JSON, bearer, and assignment paths together.

## Migration Plan

No migration is required. Ship the sanitizer and regression tests together; rollback is limited to reverting the focused code change if diagnostic formatting causes compatibility problems.
