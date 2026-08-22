# azdo-axi

Agent-friendly Azure DevOps Boards CLI wrapper.

## Pull-request review

The repository includes a narrowly scoped `PR Agent` workflow for pull requests that are opened or synchronized. Before relying on it, configure an Actions secret named exactly `OPENROUTER_API_KEY` in the repository settings. The value must be entered through the GitHub Actions secret interface or supplied interactively with `gh secret set OPENROUTER_API_KEY`; it must not be committed to the repository or printed in logs.

Validate the workflow and secret-name/setup contract with:

```sh
python3 scripts/validate-pr-agent-workflow.py
```

### Reviewing the action pin

The workflow pins `the-pr-agent/pr-agent` to a full commit SHA. To update it safely, review the upstream release or commit history and the complete diff from the current revision, replace the pin only with the reviewed full SHA, run the focused validation, and submit the change for normal review. Do not replace the SHA with a branch or mutable tag. The configured workflow events and `github_action_config.pr_actions` value must remain `[opened, synchronize]`.
