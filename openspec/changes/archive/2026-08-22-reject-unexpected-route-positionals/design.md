## Context

The route parser validates options before Azure CLI preflight, but routes without required positional arguments currently skip non-option tokens. See proposal.md and the modified specification.

## Goals / Non-Goals

**Goals:**

- Reject stray positional values for `context` and `query` before preflight.
- Preserve required work-item ID parsing and existing option behavior.

**Non-Goals:**

- Add new route options or Azure DevOps operations.

## Decisions

Apply an explicit no-positional assertion before parsing flags for routes that define only options. Keep work-item positional handling unchanged because show, update, and links require an ID. Focused parser tests cover context and WIQL cases.

## Risks / Trade-offs

- [A future route may intentionally add positionals] → Its route branch must omit the no-positional assertion and define its argument contract explicitly.
