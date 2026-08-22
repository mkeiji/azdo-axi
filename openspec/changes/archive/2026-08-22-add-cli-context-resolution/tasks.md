## 1. Package foundation

- [x] 1.1 Add the Node.js TypeScript package manifest, build/test configuration, AXI SDK, and TOON dependencies.
- [x] 1.2 Add an executable entry point and documented command surface for the supported routes and context options.

## 2. Azure DevOps boundary

- [x] 2.1 Implement a dependency-injected Azure CLI runner that executes argument arrays with JSON and non-interactive options.
- [x] 2.2 Implement Azure CLI and Azure DevOps extension preflight checks with actionable normalized errors.
- [x] 2.3 Implement deterministic organization, project, team, and iteration context resolution from options, supported environment variables, and Azure CLI defaults.

## 3. Command routing

- [x] 3.1 Route `context` through preflight and TOON context reporting.
- [x] 3.2 Route the planned work-item and WIQL commands through strict argument validation and context preflight without implementing Board operations.

## 4. Verification and documentation

- [x] 4.1 Add focused unit tests for resolution precedence, missing and ambiguous context, preflight failures, and rejected options.
- [x] 4.2 Document installation, context configuration, non-interactive behavior, and current routed-command availability.
- [x] 4.3 Run formatting, type checking, tests, and strict OpenSpec validation.
