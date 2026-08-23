## Context

The project is a Node.js package targeting Node.js 20 or newer. Its package scripts already provide `npm test` for Vitest and `npm run check` for TypeScript validation. Existing tests use controlled command-runner fixtures, so the workflow does not need Azure DevOps access.

## Goals / Non-Goals

**Goals:**

- Run the repository's test and TypeScript checks on pull requests and default-branch pushes.
- Use reproducible dependency installation through the committed lockfile.
- Expose the checks as separate, named workflow steps for clear pull-request results.

**Non-Goals:**

- Provisioning Azure DevOps credentials or accessing live Azure DevOps services.
- Adding new test tooling or changing application behavior.
- Running interactive commands.

## Decisions

- Use a single GitHub Actions workflow with `pull_request` and `push` triggers. The push trigger targets the repository's current default `master` branch explicitly.
- Run on `ubuntu-latest`, check out the repository, set up Node.js 20, and use `npm ci`. Node.js 20 satisfies the package engine requirement while remaining broadly available on GitHub-hosted runners.
- Keep `npm test` and `npm run check` as separate steps so Vitest and TypeScript validation are independently visible in the workflow result.
- Do not define Azure DevOps or other application secrets. The workflow executes only local fixture-backed tests.

## Risks / Trade-offs

- [Risk] `ubuntu-latest` may change its underlying image over time → Use the package's Node.js engine-compatible setup and standard npm commands; no runner-specific behavior is required.
- [Risk] The default branch could be renamed → The workflow's push branch should match the repository's current `master` branch and be updated with any future default-branch rename.
