## Why

Routes without positional parameters silently ignore stray values, which can make a caller believe a typo affected the selected Azure DevOps target. Route validation must reject those values before context resolution.

## What Changes

- Reject unexpected positional arguments for routes that define only options.
- Add focused regression tests for rejected context and WIQL route positionals.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `cli-context-resolution`: Extends route validation to reject unexpected positional arguments before Azure CLI invocation.

## Impact

- Updates command argument parsing and focused validation coverage.
