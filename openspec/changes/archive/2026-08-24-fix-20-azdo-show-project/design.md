## Context

The work-item implementation centralizes Azure CLI invocation in `src/work-items.ts`. The show route currently builds `az boards work-item show` arguments with `--project`, unlike the current Azure CLI command's supported syntax. The route already receives resolved organization/project context and normalizes the returned object for TOON output.

## Goals / Non-Goals

**Goals:**

- Correct only the show route's Azure argument list by removing its unsupported project option.
- Preserve organization, JSON output, relationship expansion, context metadata, result normalization, and error handling.
- Add focused regression coverage for both argv construction and successful response handling.

**Non-Goals:**

- Changing context resolution or public command-line options.
- Changing create, update, list, links, or query argument construction.
- Adding dependencies or changing output schema.

## Decisions

- Remove the `--project` pair from the argv assembled by `showWorkItem`, rather than changing shared context types or invocation helpers. This keeps the compatibility correction local to the route and prevents supported routes from regressing.
- Keep the resolved project on the normalized show result. Azure CLI no longer receives it for this command, but project remains part of the wrapper's established context and output contract.
- Extend the existing work-item read tests with an exact show argv assertion and a successful mocked Azure response assertion. Existing mutation/list/query tests remain as guards that their project arguments are unchanged.

Alternatives considered:

- Passing the project through an alternate Azure option was rejected because the issue requires the current supported show command shape and no replacement is needed by the wrapper.
- Removing project from all work-item routes was rejected because create, update, list, and query still support and require it.

## Risks / Trade-offs

- [Risk] A future Azure CLI version may alter show options again. → Mitigation: keep the route-specific argv assertion focused on the known unsupported option and retain the existing command/error normalization tests.
- [Risk] Omitting project from the Azure request could be mistaken for losing project context. → Mitigation: assert and preserve project in the normalized wrapper output and context handling.

## Migration Plan

No user migration is required. Deploy the code and regression tests together; rollback is a revert of the focused show-route argument change.
