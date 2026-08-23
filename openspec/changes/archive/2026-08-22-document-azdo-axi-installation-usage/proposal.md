## Why

The README does not yet provide a complete first-run path for installing the published CLI, authenticating with Azure DevOps, selecting an organization and project, and using the implemented read and mutation commands. Clear documentation is needed so new users can use azdo-axi without inferring undocumented Azure CLI setup steps.

## What Changes

- Rewrite the README installation and usage section as an end-to-end guide.
- Document Node.js, Azure CLI, and Azure DevOps extension prerequisites.
- Document Azure CLI authentication, organization/project context resolution, configuration, and environment variables.
- Document the current read, query, link, create, and update command surface with representative examples and important option behavior.
- Explain that authentication is delegated to Azure CLI and azdo-axi never stores credentials.

## Capabilities

### New Capabilities

None. This is a documentation-only change; no runtime behavior or specification-level behavior changes.

### Modified Capabilities

None.

## Impact

Only `README.md` and the OpenSpec planning artifacts for this documentation change are affected. No runtime code, dependencies, APIs, or authentication behavior changes.
