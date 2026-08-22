## Why

The declared package binary is built into `dist`, but a clean checkout could pack without first creating that directory. The package lifecycle must guarantee the executable is included for consumers.

## What Changes

- Build the TypeScript distribution before npm packs or publishes the package.
- Add a regression test that packs without an existing distribution directory and verifies an installed tarball can invoke `azdo-axi`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `cli-context-resolution`: Requires the installable command surface to be present in packages produced from a clean checkout.

## Impact

- Updates package lifecycle scripts and adds package-installability coverage.
