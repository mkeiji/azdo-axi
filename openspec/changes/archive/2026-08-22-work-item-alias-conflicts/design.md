## Context

`parseInvocation` canonicalizes `--assigned-to` to `assignee` and `--area-path` to `area`. The current implementation uses the canonical value whenever present and therefore does not detect duplicate aliases.

## Goals / Non-Goals

**Goals:**

- Detect both raw aliases before canonicalization and produce a local validation error.
- Keep validation before context resolution and Azure execution.
- Preserve accepted behavior when only one spelling is supplied.

**Non-Goals:**

- Removing compatibility aliases.
- Changing filter semantics, WIQL construction, or output.

## Decisions

- **Validate alias pairs in canonicalization.** `canonicalWorkItemValues` already receives the raw parsed flag record, so it can reject both pair combinations before returning the normalized invocation. This covers identical and differing values without duplicating parser state or changing route handling.
- **Use a stable conflict message.** Identify both full option names and instruct callers to choose one, allowing tests and users to distinguish this from unknown-option or duplicate-option errors.

## Risks / Trade-offs

- [Callers relying on both spellings will now fail] → This is intentional; the ambiguous input is rejected even when values match, while either individual spelling remains supported.
