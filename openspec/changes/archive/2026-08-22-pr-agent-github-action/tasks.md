## 1. Workflow

- [x] 1.1 Add `.github/workflows/pr-agent.yml` with the exact pull-request triggers, job identity, runner, minimum permissions, immutable action revision, and required PR Agent configuration.
- [x] 1.2 Ensure workflow configuration maps both OpenRouter key inputs to `OPENROUTER_API_KEY` without exposing or hard-coding a secret value.

## 2. Documentation and Validation

- [x] 2.1 Document the required `OPENROUTER_API_KEY` Actions secret, setup check, and safe process for reviewing and updating the pinned action revision.
- [x] 2.2 Add focused repository validation for workflow structure, event alignment, permissions, action pin, configuration, and secret-name/setup contract.
- [x] 2.3 Run the focused validation and inspect the complete diff for unrelated triggers, permissions, or automation.

## 3. Completion

- [x] 3.1 Validate the OpenSpec change, archive it, and commit the implementation and archived proposal artifacts on the task branch.
