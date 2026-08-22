## Context

The CLI already validates route arguments and resolves organization, project, team, and iteration through `az` preflight. Work-item routes currently stop after context resolution. Azure CLI is the external boundary and must remain non-interactive; the process should receive JSON and only the CLI boundary should format the result for agents.

## Goals / Non-Goals

**Goals:**

- Implement read-only list and show operations with deterministic, testable request construction.
- Keep context and filter scope visible in every successful result, including empty results.
- Normalize Azure failures into `AzdoAxiError` values with concise codes and suggestions.
- Bound description and history output by default while retaining original sizes and a `--full` escape hatch.

**Non-Goals:**

- Creating, updating, linking, or deleting work items.
- Implementing a general WIQL language or exposing arbitrary Azure CLI options.
- Managing Azure credentials or adding an authentication flow.

## Decisions

- **Use Azure CLI Boards commands with JSON output.** `az boards work-item list` supplies compact list fields and `az boards work-item show --expand relations` supplies details and relationships. All requests explicitly include organization/project and `--output json`.
- **Use a small allowlisted parser.** List accepts context flags plus `--assignee`, `--iteration`, `--area`, and `--full`; show accepts context flags plus `--full`. Unknown flags are rejected by the local parser before context preflight or Azure data calls.
- **Build list filters as WIQL-compatible query flags.** The adapter maps defaults to active task work items and adds assignee, iteration, and area predicates. User-facing scope retains the selected values, while the Azure request remains an argv array rather than a shell string.
- **Return normalized domain data, then encode once.** List/show services map Azure field names to stable lower-case output fields and add context/scope/count metadata. The command handler serializes that object with the existing TOON package; Azure JSON never leaks directly to the boundary.
- **Truncate only large text fields.** Description, acceptance criteria, and history entries are bounded using a shared limit and carry `originalSize`/`truncated` metadata. `--full` disables the bound. Missing fields are omitted rather than fabricated.
- **Normalize external errors centrally.** Azure CLI execution, invalid JSON, missing work items, and authorization failures become concise `AZ_*`/`WORK_ITEM_*` errors with retry, context, permission, or extension guidance.

## Risks / Trade-offs

- [Azure CLI output fields vary by extension version] → Read common field aliases and fail with an actionable invalid-output error when required identity fields are absent.
- [WIQL/list filtering semantics differ across Azure DevOps projects] → Keep predicates explicit and test argv construction; report the applied scope so callers can diagnose an unexpected empty result.
- [Large work-item history can consume memory] → Apply truncation after parsing and cap default history entries; `--full` remains an explicit opt-in.

## Migration Plan

No data migration is required. Deploy the CLI with the new read-only routes; rollback is a package/version rollback. Existing context, mutation placeholders, and authentication behavior remain unchanged.
