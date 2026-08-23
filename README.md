# azdo-axi

Agent-friendly Azure DevOps Boards CLI wrapper.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later, including npm.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli).
- The Azure DevOps extension for Azure CLI.

Check the Node.js and Azure CLI installations, then install the extension:

```sh
node --version
npm --version
az --version
az extension add --name azure-devops
az extension show --name azure-devops
```

## Installation from source

`azdo-axi` is not currently published to npm. Install it from a source checkout and build the CLI locally:

```sh
git clone https://github.com/mkeiji/azdo-axi.git
cd azdo-axi
npm ci
npm run build
node dist/bin/azdo-axi.js --version
```

The built entry point is `dist/bin/azdo-axi.js`. To make the source-built CLI available as `azdo-axi` on `PATH`, link this checkout with npm after building:

```sh
npm link
azdo-axi --version
```

`npm link` links this checkout; it does not download a published `azdo-axi` package. Re-run `npm run build` after changing the source. Without the link, run the CLI directly as `node dist/bin/azdo-axi.js`.

## Agent setup

This repository includes the agent skill at `skills/azdo-axi/SKILL.md`. Copy it into the skill directory used by the agent. For an agent using the conventional user-level `~/.agents/skills` directory:

```sh
mkdir -p "$HOME/.agents/skills/azdo-axi"
cp skills/azdo-axi/SKILL.md "$HOME/.agents/skills/azdo-axi/SKILL.md"
```

Use the equivalent user-level skill directory for an agent with a different discovery location, then restart or reload the agent if it does not discover new skills automatically. The skill assumes that `azdo-axi` is available on `PATH`; complete the `npm link` step above or invoke the source-built entry point explicitly.

## Authentication

`azdo-axi` delegates Azure DevOps authentication to Azure CLI. It has no separate azdo-axi token, login flow, credential store, or configuration file. Authenticate with Azure CLI before running a routed command:

```sh
az login
az account show
```

Install and verify the Azure DevOps extension before authenticating with it:

```sh
az extension add --name azure-devops
az extension show --name azure-devops
```

The Azure DevOps extension can authenticate with a personal access token (PAT). It prompts for the PAT and stores it under Azure CLI's control:

```sh
az devops login --organization https://dev.azure.com/example
```

`azdo-axi` invokes `az` for these operations and never stores or prints credentials. An authentication error means that the Azure CLI session, PAT, or Azure DevOps permissions need attention; update the Azure CLI authentication and verify access to the selected organization.

## Organization and project context

Every routed `azdo-axi` command needs an Azure DevOps organization and project. Each value is resolved independently in this order:

1. A command option, such as `--organization` or `--project`.
2. An environment variable: `AZDO_ORG` or `AZURE_DEVOPS_ORG` for the organization, and `AZDO_PROJECT` or `AZURE_DEVOPS_PROJECT` for the project.
3. An Azure DevOps CLI default configured with `az devops configure --defaults`.

For a repeatable default context, configure Azure CLI once:

```sh
az devops configure --defaults \
  organization=https://dev.azure.com/example \
  project=example-project
```

You can inspect the defaults with:

```sh
az devops configure --list
```

Alternatively, set context for the current shell:

```sh
export AZDO_ORG=https://dev.azure.com/example
export AZDO_PROJECT=example-project
```

Optional `team` and `iteration` context values are also supported. Set them with `--team` / `--iteration`, `AZDO_TEAM` / `AZDO_ITERATION` (or the `AZURE_DEVOPS_` equivalents), or Azure DevOps CLI defaults. An iteration context is used by `work-item list` when that command does not receive its own `--iteration`. Explicit command options take precedence over environment variables and CLI defaults. If both aliases at one level are set to different values, `azdo-axi` reports an ambiguity instead of guessing.

Verify the resolved target before reading or mutating work items:

```sh
azdo-axi context
# Or override the configured values for this invocation:
azdo-axi context \
  --organization https://dev.azure.com/example \
  --project example-project
```

The command output includes the resolved organization, project, and any optional team or iteration. The CLI also checks that Azure CLI and the Azure DevOps extension are available before resolving context.

## Usage

The commands below use the `azdo-axi` command linked to this source checkout. If you did not run `npm link`, replace `azdo-axi` with `node dist/bin/azdo-axi.js`. Run `azdo-axi --help` for the current top-level command list. The application command surface is:

```text
azdo-axi context [--organization <org>] [--project <project>] [--team <team>] [--iteration <iteration>]
azdo-axi work-item list [context options] [--assignee <user>] [--iteration <path>] [--area <path>] [--full]
azdo-axi work-item show <id> [context options] [--full]
azdo-axi work-item create [context options] --type <type> --title <title> [mutation options]
azdo-axi work-item update <id> [context options] [mutation options]
azdo-axi work-item links <id> [context options]
azdo-axi query [context options] --wiql <query>
```

The context options are `--organization`, `--project`, `--team`, and `--iteration`. The mutation options are `--type` / `--work-item-type`, `--title`, `--description`, `--parent`, `--state`, `--tags` / `--tag`, `--assignee` / `--assigned-to`, `--area` / `--area-path`, and repeatable `--field <Reference.Name=value>` options. Options that take a value use the next argument or the `--name=value` form. There is no delete command.

### Read work items

`work-item list` returns active `Task` items. It can filter by assignee, iteration path, and area path; without an explicit `--iteration`, it uses the configured context iteration when one exists:

```sh
azdo-axi work-item list \
  --organization https://dev.azure.com/example \
  --project example-project \
  --assignee ada@example.com \
  --iteration 'example-project\Sprint 1' \
  --area 'example-project\Frontend'
```

`work-item show` reads one work item by positive integer ID. Descriptions, acceptance criteria, and history are bounded by default; pass `--full` when the complete available values are needed:

```sh
azdo-axi work-item show 123 --full
```

`work-item links` reports parent, child, related, and other relationships for one work item:

```sh
azdo-axi work-item links 123
```

### Run a custom WIQL query

Use `query` as the advanced read path when the fixed `list` filters are not sufficient:

```sh
azdo-axi query \
  --wiql "SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.State] = 'Active'"
```

The WIQL is passed to Azure DevOps as supplied. Quote the query in the shell so spaces and brackets remain one argument.

### Create a work item

`work-item create` requires both `--type` and `--title`. Standard fields and project-specific fields can be supplied together:

```sh
azdo-axi work-item create \
  --type Task \
  --title 'Document the release process' \
  --description 'Add installation and upgrade instructions.' \
  --iteration 'example-project\Sprint 1' \
  --area 'example-project\Documentation' \
  --assignee ada@example.com \
  --parent 100 \
  --field Microsoft.VSTS.Common.AcceptanceCriteria='README includes a verified quickstart.' \
  --organization https://dev.azure.com/example \
  --project example-project
```

`--parent` must be a positive work-item ID. Use repeatable `--field Reference.Name=value` options for custom fields. The standard option and its corresponding custom field cannot be supplied together.

### Update a work item

`work-item update` requires a positive work-item ID and at least one field to change:

```sh
azdo-axi work-item update 123 \
  --state Active \
  --tags 'documentation; onboarding' \
  --description 'Updated description.'
```

The update route reads the target first. If all requested values already match, it does not send a mutation and reports `noOp: true`; otherwise it reports the resulting work-item ID and state. Use `--tag` more than once instead of `--tags` when composing tags as separate values, for example `--tag documentation --tag onboarding`. Do not combine the two forms.

## Output and errors

Successful routed commands emit concise structured [TOON](https://github.com/toon-format/toon) output. Results include resolved context and scope metadata; list and query results include `count` and `items`, link results include `count` and `links`, and mutations include the operation, work-item ID, `noOp`, and resulting item. Empty reads still report a zero count. Errors identify validation, authentication, permission, context, or Azure CLI/extension setup problems and include a suggested next command when one is available.

## Pull-request review

The repository includes a narrowly scoped `PR Agent` workflow for pull requests that are opened or synchronized. Before relying on it, configure an Actions secret named exactly `OPENROUTER_API_KEY` in the repository settings. The value must be entered through the GitHub Actions secret interface or supplied interactively with `gh secret set OPENROUTER_API_KEY`; it must not be committed to the repository or printed in logs.

Validate the workflow and secret-name/setup contract with:

```sh
python3 scripts/validate-pr-agent-workflow.py
```

### Reviewing the action pin

The workflow pins `the-pr-agent/pr-agent` to a full commit SHA. To update it safely, review the upstream release or commit history and the complete diff from the current revision, replace the pin only with the reviewed full SHA, run the focused validation, and submit the change for normal review. Do not replace the SHA with a branch or mutable tag. The configured workflow events and `github_action_config.pr_actions` value must remain `[opened, synchronize]`.
