## Context

The create route currently passes `System.Parent=<id>` in the create field payload and immediately normalizes the create response. The link inspection route already reads expanded relations, while no create-time relation mutation or verification exists. Azure DevOps may accept the create request without turning that field into a hierarchy relation.

## Goals / Non-Goals

**Goals:**

- Use Azure DevOps's supported work-item relation command to attach the requested parent after creation.
- Verify the persisted relation using the same expanded-relation read shape used by link inspection before returning the create result.
- Keep the no-parent path unchanged and keep failures within existing normalized error conventions.

**Non-Goals:**

- Changing update, link inspection, or context resolution behavior.
- Retrying, repairing, or deleting a work item after a relation failure.
- Requiring live Azure DevOps credentials for regression tests.

## Decisions

- **Create, then relate, then verify.** The create response supplies the child ID needed by `az boards work-item relation add`; a subsequent `work-item show --expand relations` is the authoritative verification. This is preferred over treating `System.Parent` in the create payload as sufficient because that payload is the observed divergence. The initial create payload will not include `System.Parent` when `--parent` is used, so the explicit relation operation is the sole parent mutation.
- **Use the Azure CLI relation command.** Build `boards work-item relation add --id <child> --relation-type parent --target-id <parent>` with the resolved organization and non-interactive output flags. This uses Azure DevOps's hierarchy-aware operation rather than relying on field assignment.
- **Accept either Azure representation during verification.** A successful read may expose the parent as `System.Parent` or as a reverse hierarchy relation URL. The requested positive parent ID must match one of those representations; otherwise the route raises an unverified-parent error.
- **Return the verified item.** The normalized create result is built from the verification response, preserving the existing envelope while ensuring success reflects the checked state.

## Risks / Trade-offs

- [Relation mutation can succeed while a later read is stale or incomplete] → Treat missing evidence as failure and do not report successful creation; the caller can inspect or retry separately.
- [The create request can succeed before relation attachment fails] → Preserve the normalized Azure error and never conceal that the created item may require cleanup or repair.
- [Azure CLI relation output may vary] → Do not depend on its response body; only normalize command failures, then verify through the stable expanded work-item read.

## Migration Plan

No data migration is required. Deploying the change affects only future creates that supply `--parent`; existing orphaned work items remain unchanged and can be repaired with the normal Azure DevOps relationship tools.
