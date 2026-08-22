## Context

`normalizeAzureError` lowercases Azure CLI error text and currently checks `not found|does not exist|404` before permission indicators. Azure DevOps may deliberately use not-found wording for unauthorized resources or combine existence and permission alternatives in one message.

## Goals / Non-Goals

**Goals:**

- Detect explicit permission, forbidden, unauthorized, and no-permission indicators before not-found patterns.
- Keep genuine missing-resource responses mapped to `WORK_ITEM_NOT_FOUND` or `AZ_RESOURCE_NOT_FOUND` with the existing context-check suggestion.
- Cover permission-only and combined messages in regression tests.

**Non-Goals:**

- Changing error codes, suggestions, or Azure command behavior.
- Guessing permission failures from unrelated generic errors.

## Decisions

- **Reorder classification branches.** Evaluate the existing permission regex before the not-found regex. The permission regex includes `no permission` and `no permissions` so combined “does not exist or no permission” messages classify as `AZ_PERMISSION_DENIED`.
- **Retain existing not-found mapping.** If no permission indicator is present, the current not-found branch and its codes/suggestion remain unchanged.

## Risks / Trade-offs

- [Azure messages may vary in capitalization or punctuation] → Existing lowercasing and broad permission indicators remain in place; regression cases model combined wording.
- [A message may mention both a true missing resource and access restrictions] → Permission takes precedence intentionally because permission remediation is safer and actionable.
