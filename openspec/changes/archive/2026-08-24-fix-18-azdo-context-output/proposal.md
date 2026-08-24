## Why

Azure CLI 2.89.1 with azure-devops extension 1.0.6 can ignore the requested JSON output format for `az devops configure --list` and emit its defaults as INI-style text. The context command therefore rejects valid configured defaults, and it currently performs that failing defaults query even when every context field was supplied explicitly.

## What Changes

- Resolve Azure DevOps CLI defaults only when at least one context field cannot be resolved from explicit options or environment variables.
- Accept the observed `[defaults]` INI-style defaults output in addition to JSON, using bounded parsing that rejects malformed or ambiguous context values.
- Preserve existing precedence, ambiguity checks, and actionable Azure CLI, extension, authentication, and missing-context errors.
- Add focused regression coverage for JSON, INI, explicit-only, mixed explicit/default, malformed, and ambiguous defaults cases.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `cli-context-resolution`: Support deterministic context resolution when Azure DevOps CLI defaults are returned in the observed INI-style format and avoid an unneeded defaults read.

## Impact

- Affected code: `src/az.ts`, `src/context.ts`, and `test/context.test.ts`.
- No new runtime dependencies or changes to unrelated commands.
