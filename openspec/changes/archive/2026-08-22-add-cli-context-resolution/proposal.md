## Why

Azure DevOps Boards automation needs a predictable command boundary that can safely select its target context before feature commands are implemented. Establishing this foundation now prevents commands from silently operating against an unintended organization or project.

## What Changes

- Add an installable Node.js TypeScript CLI package with the AXI runtime and TOON formatting dependencies.
- Add non-interactive command routing for the planned Azure DevOps Boards command surface.
- Add Azure CLI preflight checks, structured JSON command invocation, and deterministic organization/project resolution.
- Add focused tests for context precedence, missing or ambiguous context, and Azure CLI preflight errors.

## Capabilities

### New Capabilities

- `cli-context-resolution`: Provides the CLI command skeleton, Azure CLI preflight checks, and safe Azure DevOps organization and project context resolution.

### Modified Capabilities

- None.

## Impact

- Adds the package manifest, TypeScript sources, test suite, and agent-facing usage documentation.
- Invokes the installed Azure CLI and its Azure DevOps extension without managing authentication credentials.
