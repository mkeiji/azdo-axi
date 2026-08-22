## Why

Agents can currently inspect Azure DevOps work items but cannot carry out routine delivery work without falling back to raw Azure CLI commands. That makes creation and targeted updates inconsistent, harder to validate, and less safe for automation.

## What Changes

- Add non-interactive `work-item create` support for standard and project-specific work-item types.
- Add non-interactive `work-item update <id>` support for fields commonly changed by agents, including bug state, tags, and assignment.
- Support task creation with title, description, parent, iteration, and assignee, plus practical custom field input.
- Resolve and report the explicit organization/project context on every mutation, and report the resulting work-item state.
- Detect safely satisfied updates and return them as no-ops without issuing a mutation.
- Extend the installable `skills/azdo-axi/` skill with mutation commands and the compact output contract.
- Add focused mutation tests and preserve Azure CLI authentication delegation and non-interactive behavior.

## Capabilities

### New Capabilities

- `work-item-mutations`: Create and update standard or custom Azure DevOps work items with safe, structured mutation results.

### Modified Capabilities

- `work-item-read`: Preserve the existing context resolution, Azure error normalization, and output conventions for the expanded work-item command surface.

## Impact

- `src/arguments.ts`, `src/cli.ts`, and `src/work-items.ts` gain mutation parsing, Azure command construction, no-op detection, and result normalization.
- `test/work-items.test.ts` gains payload, no-op, validation, and failure coverage.
- `skills/azdo-axi/SKILL.md` and `README.md` document the installable agent-facing commands.
- No authentication or token-management dependency is added; all Azure access remains delegated to `az`.
