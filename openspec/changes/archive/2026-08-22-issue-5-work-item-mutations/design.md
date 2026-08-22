## Context

The CLI already routes work-item create and update operations through `az boards`, resolves organization/project context before dispatch, and accepts repeatable custom fields. See `proposal.md` for motivation and `specs/work-item-mutations/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**

- Validate field reference names at both invocation parsing and payload construction boundaries.
- Preserve values verbatim after the first equals separator.
- Keep mutation calls argv-only, non-interactive, and explicitly scoped.

**Non-Goals:**

- Maintaining a registry of project-specific fields.
- Adding deletion, confirmation prompts, token management, or a dashboard hook.

## Decisions

- Use a conservative reference-name grammar of ASCII letters, digits, underscores, and dots, beginning with a letter. This matches Azure DevOps reference-name conventions while allowing standard, Microsoft, and custom names.
- Keep the first `=` as the separator and preserve the remainder exactly; field values may legitimately contain equals signs.
- Share validation in the work-item mutation layer so direct helper callers receive the same safety guarantees as CLI callers.

## Risks / Trade-offs

- Some future Azure field providers could accept characters outside the conservative grammar → callers can use an explicitly supported Azure reference name once the grammar is extended.
- Validation is duplicated at parser and builder boundaries → the duplication is intentional defense-in-depth before any Azure mutation.

## Migration Plan

No migration is required. Build and package normally; invalid field names fail locally and existing valid mutation payloads remain unchanged. Rollback is a code revision rollback.
