## Context

See `proposal.md` for motivation and scope. The existing CLI resolves an explicit Azure DevOps organization and project before every routed command, invokes Azure CLI through an argv-only runner, and returns normalized objects for TOON serialization. The mutation routes currently parse but deliberately return an unavailable-feature error.

## Goals / Non-Goals

**Goals:**

- Construct Azure CLI work-item create and update requests without shell interpolation.
- Keep standard field aliases ergonomic while allowing arbitrary `Field.ReferenceName=value` fields.
- Read the target item before updates so already-satisfied field changes can be returned as a no-op.
- Return a stable mutation envelope containing operation, context, ID, resulting state, and no-op status.
- Keep all operations non-interactive and preserve authentication delegation to Azure CLI.

**Non-Goals:**

- Exposing deletion or any destructive operation.
- Implementing a separate Azure DevOps API client or token store.
- Guessing project-specific field reference names beyond explicitly supplied custom fields.
- Adding a dashboard or hook without an established repository convention.

## Decisions

1. **Use `az boards work-item create/update` with explicit JSON output.** This matches the existing boundary and provides the same authentication, permissions, and organization/project semantics as raw `az boards`. WIQL remains read-only and is not used for mutation.

2. **Expose normalized aliases plus repeatable `--field name=value`.** Create accepts `--type`, `--title`, `--description`, `--parent`, `--iteration`, `--assignee`, and repeatable custom fields. Update accepts optional `--title`, `--description`, `--state`, `--tags`, `--assignee`, `--iteration`, `--area`, and repeatable custom fields. Standard aliases map to System/Microsoft reference names; custom fields are passed unchanged after validating a non-empty reference name and value.

3. **Use a pre-read for updates.** The existing show command retrieves current fields and the mutation layer compares requested values before sending an update. Tags compare as normalized tag sets and assignment compares the stable display/unique-name representation when available. If all requested values are already satisfied, the command returns the current item as `noOp: true` and does not call update.

4. **Represent parent on create as `System.Parent`.** Azure DevOps accepts this relationship through the create field payload. The ID is validated as a positive integer before Azure is called. Create output uses the returned work-item JSON as the resulting state.

5. **Keep output stable and compact.** Mutation results contain `operation`, `context`, `workItemId`, `type`, `title`, `state`, `noOp`, and normalized `item` details where available. Errors continue through `normalizeAzureError`, with mutation-specific operation names for actionable diagnostics.

## Risks / Trade-offs

- [Project-specific field names differ across processes] → Require explicit reference-name/value pairs and preserve returned custom fields rather than maintaining an incomplete type registry.
- [Azure CLI output shape varies] → Validate JSON objects and fall back to the requested ID while retaining normalized error handling.
- [Update pre-read adds one request] → It is necessary to enforce safe no-op behavior and prevents unnecessary writes.
- [Azure CLI field syntax changes] → Keep payload construction isolated in exported helper functions covered by argv-level tests.

## Migration Plan

Build and package the CLI normally. Existing read-only routes are unchanged. Rollback is a code/package rollback; no schema or persistent local state is introduced.
