## Context

The work-item mutation implementation builds Azure CLI argv in `src/work-items.ts`. The update operation first reads the target, compares requested values, and only then invokes `az boards work-item update`; its update builder currently includes `--project`, which the current Azure CLI does not accept. Context resolution and normalized mutation output are independent wrapper concerns and must remain intact.

## Goals / Non-Goals

**Goals:**

- Generate a supported `az boards work-item update` argv without `--project`.
- Keep the resolved organization in the Azure update request and keep the resolved project in wrapper context, result, and error behavior.
- Prove that read-before-update, changed-field selection, successful response normalization, no-op behavior, and field validation remain unchanged.
- Preserve project arguments on create, list, query, and other routes whose Azure commands support them.

**Non-Goals:**

- Changing context precedence or the public command syntax.
- Altering the pre-update read, Azure error normalization, result schema, or any route other than update's mutation request.
- Adding dependencies or making a live Azure DevOps account part of automated tests.

## Decisions

- **Remove the project pair only in `buildUpdateWorkItemArgs`.** This is the narrowest compatibility fix and avoids changing shared context types or argument construction used by supported routes. An alternate approach of removing project from all work-item operations would regress create, list, and query behavior.
- **Use a sequential fake runner in regression coverage.** The test will return the current item for the pre-read and a distinct updated item for the update response, allowing it to verify both the exact update argv and the normalized resulting state. A live Azure test is rejected because it would require external credentials and mutable shared state.
- **Keep the pre-update read and wrapper project context unchanged.** The update request's unsupported CLI option is independent from the wrapper's need to resolve and report its project, and changing read or result behavior would exceed issue 22.

## Risks / Trade-offs

- [Risk] Azure CLI argument support can vary by extension version. → The generated update argv is asserted explicitly and retains organization, JSON output, and non-interactive flags.
- [Risk] A test helper that returns one response for both calls could hide response-normalization regressions. → Regression coverage supplies separate pre-read and update responses and asserts the resulting state.
