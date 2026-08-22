## Why

The repository needs a narrowly scoped pull-request review workflow so opened and updated pull requests can receive automated review without granting the action unnecessary repository access. Pinning the action and documenting its secret contract makes the integration reproducible and safer to maintain.

## What Changes

- Add a `PR Agent` workflow at `.github/workflows/pr-agent.yml` for pull-request `opened` and `synchronize` events only.
- Run the pinned PR Agent action with the required model, review settings, token configuration, and minimum write permissions.
- Document the required `OPENROUTER_API_KEY` Actions secret and a safe process for reviewing and updating the pinned action revision.
- Add focused validation for workflow structure and secret-name/setup requirements.

## Capabilities

### New Capabilities

- `pinned-pr-agent-workflow`: Provides constrained automated pull-request review through a pinned GitHub Action and a documented secret/setup contract.

### Modified Capabilities

- None.

## Impact

This adds one GitHub Actions workflow, repository documentation for setup and maintenance, and focused validation assets. It introduces no application runtime dependency or API change; GitHub Actions will invoke the external PR Agent action only for the specified pull-request events.
