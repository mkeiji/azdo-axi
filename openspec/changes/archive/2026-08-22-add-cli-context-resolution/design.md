## Context

The repository currently has no application package. The command surface must establish a safe boundary for later Boards functionality; see proposal.md and the `cli-context-resolution` specification for required behavior.

## Goals / Non-Goals

**Goals:**

- Make a TypeScript Node.js package installable and directly invocable.
- Centralize Azure CLI execution, preflight, option validation, and context resolution so later commands cannot bypass them.
- Keep the initial routed commands non-mutating while exposing their stable command shape.

**Non-Goals:**

- Implement Board work-item reads, WIQL execution, links, or mutations.
- Authenticate users, persist tokens, or prompt for input.
- Infer organization or project from an Azure subscription or an arbitrary account selection.

## Decisions

### Use a dependency-injected process boundary

The Azure CLI adapter will receive a small command-runner interface. Production executes `az` with argument arrays and tests supply a fake runner. This avoids shell interpolation, makes non-interactive JSON invocation explicit, and allows preflight and defaults behavior to be tested without Azure credentials. A direct child-process dependency in every command was rejected because it would duplicate safety checks and be difficult to test.

### Resolve each context field with fixed precedence

`--organization` and `--project` win independently, followed by `AZDO_ORG`/`AZURE_DEVOPS_ORG` and `AZDO_PROJECT`/`AZURE_DEVOPS_PROJECT`, then `az devops configure --list` defaults. A source that offers more than one distinct non-empty value is rejected as ambiguous. This avoids silently selecting a target while retaining common CI and local configuration paths. Falling back to a subscription or account context was rejected because it does not identify an Azure DevOps target.

### Keep routes as preflight-aware placeholders

Every declared route parses its own small allowlist and resolves context before responding that its Board operation is not yet implemented. This proves routing and safety behavior without introducing Azure DevOps mutations or pretending that work-item data is available. Passing arbitrary options through to Azure CLI was rejected because it violates the unknown-option safety contract.

### Report context using the formatter boundary

The context route emits a TOON-formatted record from parsed JSON/default data. It carries organization and project and adds team or iteration only when configured or returned as relevant scope. Raw Azure CLI output is not exposed as the public interface.

## Risks / Trade-offs

- [Azure CLI default output varies by extension version] → Parse both object and key/value default formats and fail with a configuration error if it cannot provide a deterministic value.
- [Placeholder routes may be mistaken for completed Board operations] → Return a clear feature-unavailable error after successful preflight rather than no-op success.
- [Environment variable naming varies across users] → Support the documented AXI names and Azure DevOps-compatible names only, and document them.

## Migration Plan

The package is new and has no migration or rollback requirements. Removing the package files reverts the change.
