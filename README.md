# azdo-axi

Agent-friendly Azure DevOps Boards CLI wrapper.

## Installation and usage

Requires Node.js 20 or later, the Azure CLI, and the Azure DevOps Azure CLI extension.

```sh
npm install
npm run build
node dist/bin/azdo-axi.js context --organization https://dev.azure.com/example --project example-project
```

The CLI delegates authentication to the existing `az` and Azure DevOps extension configuration. It never stores, prints, or manages tokens, and it does not prompt for input. Install the extension if needed:

```sh
az extension add --name azure-devops
```

### Context selection

Every routed command resolves its organization and project independently in this order:

1. `--organization` and `--project` command options.
2. `AZDO_ORG` / `AZURE_DEVOPS_ORG` and `AZDO_PROJECT` / `AZURE_DEVOPS_PROJECT` environment variables.
3. Azure DevOps CLI defaults from `az devops configure --defaults organization=<org> project=<project>`.

`AZDO_TEAM` / `AZURE_DEVOPS_TEAM` and `AZDO_ITERATION` / `AZURE_DEVOPS_ITERATION` (or their matching command options) are included in context output when set. Conflicting values at the same precedence level, or a missing organization or project, produce an actionable error rather than selecting a target.

### Command surface

```text
azdo-axi context [--organization <org>] [--project <project>] [--team <team>] [--iteration <iteration>]
azdo-axi work-item list [--assignee <user>] [--iteration <path>] [--area <path>] [--full]
azdo-axi work-item show <id> [--full]
azdo-axi work-item create
azdo-axi work-item update <id>
azdo-axi work-item links <id>
azdo-axi query --wiql "..."
```

All route options are validated before Azure CLI preflight. `work-item list` reads active Task items and can filter by assignee, iteration, and area path; a configured context iteration is used when no list iteration is supplied. `work-item show <id>` includes available details and relationships, while `work-item links <id>` returns parent, child, and related links. `query --wiql` is the advanced raw-WIQL escape hatch for custom queries and fields. Responses are concise TOON with context and scope metadata, including an explicit zero count for empty results. Large descriptions and history are bounded by default and can be returned in full with `--full`. These operations are read-only; mutation routes remain unavailable.

## Pull-request review

The repository includes a narrowly scoped `PR Agent` workflow for pull requests that are opened or synchronized. Before relying on it, configure an Actions secret named exactly `OPENROUTER_API_KEY` in the repository settings. The value must be entered through the GitHub Actions secret interface or supplied interactively with `gh secret set OPENROUTER_API_KEY`; it must not be committed to the repository or printed in logs.

Validate the workflow and secret-name/setup contract with:

```sh
python3 scripts/validate-pr-agent-workflow.py
```

### Reviewing the action pin

The workflow pins `the-pr-agent/pr-agent` to a full commit SHA. To update it safely, review the upstream release or commit history and the complete diff from the current revision, replace the pin only with the reviewed full SHA, run the focused validation, and submit the change for normal review. Do not replace the SHA with a branch or mutable tag. The configured workflow events and `github_action_config.pr_actions` value must remain `[opened, synchronize]`.
