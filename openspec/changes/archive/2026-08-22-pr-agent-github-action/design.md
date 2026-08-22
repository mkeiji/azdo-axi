## Context

The repository currently contains only its README, so the integration can be kept to one workflow, concise setup/maintenance guidance, and a focused validation check. The issue requires exact event, permission, configuration, and immutable-revision boundaries; no reusable application code or broad CI is needed.

## Goals / Non-Goals

**Goals:**

- Express the required PR Agent configuration in a reviewable workflow.
- Keep credentials supplied by GitHub Actions secrets and verify the secret-name contract without inspecting values.
- Make the action revision and its update procedure auditable.
- Validate the workflow's exact security and event constraints locally.

**Non-Goals:**

- Running the workflow for issues, pushes, manually dispatched runs, or other pull-request activity types.
- Enabling automatic PR descriptions or code improvements.
- Adding unrelated CI, dependencies, or broader token permissions.

## Decisions

- **Use a single workflow with explicit event filters.** This keeps the trigger surface directly inspectable and ensures the action configuration's `pr_actions` value remains aligned with the workflow trigger. A generalized event trigger or a second workflow would make the requested boundary harder to verify.
- **Pin the action to the supplied full commit SHA.** A mutable tag is easier to read but can change without a reviewed repository update. The maintenance guidance will require reviewing upstream history and the exact commit before changing the pin.
- **Use a repository-level validation script based on structural text/YAML checks.** The repository has no existing test framework, and a focused standard-library check can validate the contract without network access or secret access. A generic workflow linter alone would not prove the required secret name, exact permissions, or disabled settings.
- **Document setup and revision maintenance in README.md.** This is the only existing project documentation and keeps operator instructions discoverable without introducing unrelated documentation structure.

## Risks / Trade-offs

- [Risk] The external action or its configuration schema may change independently of this repository. → Mitigation: retain the full SHA pin, review upstream changes before updates, and run the focused validation after any update.
- [Risk] A missing or misnamed repository secret prevents reviews. → Mitigation: document `OPENROUTER_API_KEY` exactly and validate references by name while never reading secret values.
- [Risk] YAML parsing libraries may not be installed locally. → Mitigation: make validation use a small Python standard-library contract checker that rejects unsafe or missing workflow text and can run in a clean checkout.

## Migration Plan

Add the workflow and documentation, then run the focused validation. Configure `OPENROUTER_API_KEY` in the repository's Actions secrets before enabling review. To roll back, remove the workflow or revert the commit; no application data migration is required.
