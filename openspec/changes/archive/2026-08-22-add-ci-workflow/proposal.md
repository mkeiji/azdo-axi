## Why

The repository does not currently run its automated tests and TypeScript validation for pull requests or default-branch updates. A repository-managed CI workflow will provide visible, repeatable checks before changes are integrated.

## What Changes

- Add a GitHub Actions workflow for pull requests and pushes to the default branch.
- Install dependencies with `npm ci`.
- Run the Vitest suite with `npm test`.
- Run TypeScript validation with `npm run check`.
- Keep CI independent of Azure DevOps credentials by relying on the existing controlled command-runner test fixtures.

## Capabilities

### New Capabilities

None. This is a repository tooling change and does not add or modify product behavior.

### Modified Capabilities

None.

## Impact

The change adds one workflow file under `.github/workflows/`. It uses only the repository contents and standard GitHub-hosted runner tooling; no application dependencies, APIs, or secrets are changed.
