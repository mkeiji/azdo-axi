## Context

See `proposal.md` for motivation. `src/work-items.ts` centralizes show argument construction in `readRawWorkItem`, which already accepts an `includeProject` switch. The standalone show route passes `false`, while update relies on the default and links builds a separate show argv. Azure CLI is not installed in this worktree, so compatibility evidence is limited to the issue's current-route findings and the existing route-specific contracts; no create, list, or query arguments will be changed without direct evidence.

## Goals / Non-Goals

**Goals:**

- Explicitly disable the project option for the update pre-read.
- Remove only the project option from the links show request.
- Preserve context, output normalization, read-before-update, no-op detection, and supported project-bearing routes.
- Add exact argv regression coverage for all show-based paths and project-retention coverage for create, list, and query.

**Non-Goals:**

- Changing context resolution or public command-line options.
- Changing update mutation argv, create/list/query route shapes, output schemas, or error handling.
- Replacing Azure CLI with direct API calls or adding dependencies.

## Decisions

- Pass `false` explicitly to `readRawWorkItem` from `updateWorkItem`, rather than changing the helper default. This makes the route's compatibility requirement visible and keeps any future callers explicit.
- Remove the links route's local `--project` pair without changing its organization, relation expansion, output, or error flags. The link route still reports project context in its wrapper result.
- Keep project arguments on create, list, and query. They use different Azure CLI routes, and the issue's compatibility audit identifies only the show-based call sites as unsupported. Existing tests will assert these arguments remain present.
- Use mocked command runners and exact argv assertions instead of live Azure requests. This matches the project's dependency-injected boundary and avoids requiring credentials while preserving command-construction evidence.

Alternatives considered:

- Changing the shared helper default to omit project was rejected because it could silently alter future supported callers; explicit per-route intent is safer.
- Removing project from every route was rejected because create, list, and query retain supported project arguments.
- Introducing a replacement project flag for show was rejected because current evidence identifies no supported replacement required by the wrapper.

## Risks / Trade-offs

- [Risk] Azure CLI compatibility may vary by extension version. → Mitigation: limit this change to the documented show-route incompatibility, record the unavailable local CLI, and protect each route's argv with focused tests.
- [Risk] Omitting the CLI project argument could be confused with losing project selection. → Mitigation: retain project in resolved context, scope, and mutation/read output assertions.

## Migration Plan

No user migration is required. Deploy the focused source and tests together; rollback is a revert of the two show-based argument changes.
