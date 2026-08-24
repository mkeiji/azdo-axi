## Context

`preflightAzureDevOps` currently checks the executable and extension before unconditionally reading `az devops configure --list --output json`; `resolveContextValues` then applies precedence. Azure CLI 2.89.1 with azure-devops extension 1.0.6 was reproduced returning INI-style output for that command despite the JSON request. See `proposal.md` for motivation and `specs/cli-context-resolution/spec.md` for behavior.

## Goals / Non-Goals

**Goals:**

- Retain the current Azure CLI and extension availability checks.
- Skip the defaults read only when every context field is already determined by higher-precedence sources.
- Parse the known defaults representations with strict validation and retain existing error classes for unusable output and ambiguous context.

**Non-Goals:**

- Supporting general-purpose INI syntax or undocumented output variants.
- Changing authentication, command routing, context precedence, or Azure CLI dependencies.

## Decisions

### Determine whether defaults are needed before preflight reads them

Context resolution will inspect explicit and environment sources first to determine whether organization, project, team, and iteration all have exactly one higher-precedence value. The CLI and extension checks still run; the defaults command runs only if at least one field needs fallback resolution.

This preserves optional team and iteration defaults when they are not otherwise selected. Skipping defaults whenever organization and project are explicit was rejected because it would silently change existing optional-scope behavior.

### Normalize supported defaults output at the Azure CLI boundary

The Azure CLI boundary will first parse JSON. If JSON parsing fails, it will accept only line-oriented `key = value` entries inside exactly one `[defaults]` section, recognizing the four supported context keys. Repeated recognized keys remain represented so existing ambiguity validation can reject conflicting values. Unrecognized sections and non-default settings are ignored; malformed defaults-section syntax is rejected with the existing actionable invalid-output error.

Adding an INI dependency was rejected because the supported external output is narrow and a small parser keeps the accepted grammar explicit.

## Risks / Trade-offs

- [Future Azure CLI output format differs from JSON or the observed INI section] → Reject it with the existing actionable output error rather than inferring a target.
- [A caller expects defaults to be read for side effects] → The defaults command is a read and is only omitted once all context fields are fully selected by higher-precedence sources.

## Migration Plan

No configuration migration is required. Existing JSON defaults continue to work; installations producing the observed INI-style output gain compatibility. Revert the code change to restore prior output handling if needed.
