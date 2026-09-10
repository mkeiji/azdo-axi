## Context

The repository currently has a dedicated `PR Agent` workflow, validation script, README setup guidance, and a capability specification describing that external pull-request automation. See proposal.md for motivation and the delta specification for the resulting behavior.

## Goals / Non-Goals

**Goals:**

- Ensure pull-request events cannot trigger the PR Agent action.
- Remove repository-maintained references that say the workflow is available.
- Preserve the existing CI workflow unchanged.

**Non-Goals:**

- Change CI checks or other GitHub Actions automation.
- Manage repository secrets outside version-controlled configuration.

## Decisions

- Delete the dedicated workflow rather than disable its triggers. This makes the automation unavailable for every event and prevents configuration from continuing to advertise an inactive workflow. Keeping a disabled workflow file would leave obsolete automation configuration in the repository.
- Delete the workflow-specific validator and README section because they validate and document behavior that no longer exists. Keeping them would misrepresent available automation.
- Update the capability specification through the OpenSpec delta so the repository's documented automation contract matches the configuration.

## Risks / Trade-offs

- [External consumers expect PR Agent comments] → The workflow is intentionally unavailable; existing CI and human review remain available for pull requests.
- [A secret remains configured in repository settings] → It is not usable by a removed workflow; maintainers can remove it through their standard secret-management process.

## Migration Plan

1. Remove the workflow, validator, and documentation references together.
2. Confirm the remaining CI workflow is unchanged and no active repository files advertise PR Agent automation.
3. Archive the OpenSpec change so the capability specification records the new state.

Rollback consists of restoring the removed workflow, validation script, documentation, and prior specification from version control.
