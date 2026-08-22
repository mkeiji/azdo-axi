## Context

The CLI already resolves Azure DevOps context before routed commands, invokes `az` through an argv-based runner, normalizes read-only work-item data, and lets the SDK serialize command results at the boundary. The new routes must fit those contracts while retaining fields Azure returns for custom process templates.

## Goals / Non-Goals

**Goals:**

- Add raw WIQL execution with explicit organization/project arguments and normalized count, scope, and item data.
- Add relationship inspection using the existing work-item show response with relations expanded.
- Classify Azure relation names into parent, child, and related categories while retaining unknown relation metadata.
- Keep validation before context preflight/Azure data calls and share error/truncation helpers.

**Non-Goals:**

- No mutation commands, arbitrary Azure resource queries, or support for repositories, pipelines, releases, test plans, wikis, or other services.
- No attempt to enumerate every Azure field schema; custom fields are preserved as returned data.

## Decisions

- **Reuse `az boards query --wiql` for raw queries.** This is the supported structured Boards query route already used by list, avoids shell interpolation, and lets the supplied WIQL remain an advanced escape hatch. Alternatives such as invoking `az` through a shell or adding a REST client would duplicate authentication and violate the existing boundary.
- **Use `az boards work-item show --expand relations` for links.** Azure returns relation URLs and attributes in the existing show payload, so link inspection can avoid a second request. Relation names are mapped by `System.LinkTypes.Hierarchy-Forward` (child), `System.LinkTypes.Hierarchy-Reverse` (parent), and `System.LinkTypes.Related` (related), with a safe fallback category for other links.
- **Retain custom fields under `fields`.** Standard summaries remain concise, while raw query rows and link target data include the Azure `fields` object (bounded text where output is intentionally detailed). This preserves custom process data without hard-coding field names.
- **Represent empty results explicitly.** Query and link result envelopes always contain `count: 0` and context/scope metadata, making no-result responses actionable for agents.
- **Keep TOON at the SDK boundary.** Internal functions return structured records and do not format strings; `runAxiCli` remains responsible for output and error serialization.

## Risks / Trade-offs

- [Risk] Azure CLI query result shapes may vary between extension versions. → Validate arrays and objects, return the existing invalid-output error, and preserve fields without assuming every standard field exists.
- [Risk] Custom fields can contain large or sensitive-looking values. → Preserve values for practical interoperability, but apply existing bounded text behavior to known large text fields and never print credentials or invoke token handling.
- [Risk] Azure relation types beyond the requested three may appear. → Keep the original relation type and classify it as `other` rather than dropping it.

## Migration Plan

Build and release the CLI with the new read-only routes. Existing commands and output shapes remain compatible; rollback is a normal package/version rollback because no persisted data or server-side configuration changes are introduced.
