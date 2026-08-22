## Why

Agents need a predictable, non-interactive way to create and update Azure DevOps work items while preserving the explicitly selected organization and project. Mutation support is present in the command surface, but custom-field input must be validated consistently at the CLI boundary so invalid payloads cannot reach Azure.

## What Changes

- Harden create and update custom-field validation for reference-name/value input.
- Preserve standard mutation aliases, project-specific work-item types, no-op detection, and explicit target reporting.
- Keep deletion unavailable and authentication delegated to Azure CLI.
- Retain the installable `skills/azdo-axi/` command and compact-output documentation.

## Capabilities

### New Capabilities

- `work-item-mutations`: Safe creation and update behavior for standard and project-specific Azure DevOps work items.

### Modified Capabilities

- `work-item-mutations`: Require valid Azure DevOps field reference names before any mutation request.

## Impact

- `src/arguments.ts` and `src/work-items.ts` validate custom field syntax before Azure CLI invocation.
- Mutation tests and OpenSpec artifacts document the safety contract.
- No new dependency, token handling, or persistent state is introduced.
