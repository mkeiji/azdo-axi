# pinned-pr-agent-workflow Specification

## Purpose
Provides constrained automated pull-request review for selected pull-request events while protecting repository access and keeping the external action reproducibly pinned.
## Requirements
### Requirement: Constrained PR Agent workflow

The repository SHALL provide a GitHub Actions workflow named `PR Agent` that runs only for pull requests with the `opened` and `synchronize` activity types. The workflow SHALL run on `ubuntu-latest`, define job id `pr_agent_job` with display name `Run PR Agent`, and invoke `the-pr-agent/pr-agent` at revision `f6af7d77554ff8d26adffded077e6461329e92fa`.

#### Scenario: Pull request review starts for supported events

- **WHEN** a pull request is opened or synchronized
- **THEN** the workflow runs the pinned PR Agent action on `ubuntu-latest`

#### Scenario: Unsupported event does not start the workflow

- **WHEN** a pull request event has an activity type other than `opened` or `synchronize`
- **THEN** this workflow does not run

### Requirement: Minimum permissions and review configuration

The workflow SHALL grant only `contents: read`, `issues: write`, and `pull-requests: write` permissions. The action SHALL receive `GITHUB_TOKEN`, both OpenRouter key inputs from the `OPENROUTER_API_KEY` Actions secret, model `openrouter/deepseek/deepseek-v4-flash-0731`, automatic review enabled, automatic description disabled, automatic improvement disabled, and configured PR action events `[opened, synchronize]`.

#### Scenario: Review configuration is applied

- **WHEN** the action step runs for a supported pull-request event
- **THEN** it has the required token, OpenRouter key mappings, model, review setting, disabled description and improvement settings, and matching PR action event list

#### Scenario: Workflow permissions are restricted

- **WHEN** GitHub evaluates the workflow job token
- **THEN** it grants only the three declared permissions and no broader permission set

### Requirement: Secret setup and pinned revision maintenance are verifiable

Repository-maintained guidance or validation SHALL identify `OPENROUTER_API_KEY` as the required Actions secret without exposing or hard-coding its value. The repository SHALL record a safe review and update process for the pinned action revision, including reviewing the upstream change and validating the resulting workflow before changing the pin.

#### Scenario: Secret setup is checked without revealing the value

- **WHEN** a maintainer follows the setup check
- **THEN** the check confirms the required secret name and never prints or embeds the secret value

#### Scenario: Action revision is updated safely

- **WHEN** a maintainer proposes a new action revision
- **THEN** they review the upstream revision, update the full immutable commit pin, and run focused workflow validation before adoption
