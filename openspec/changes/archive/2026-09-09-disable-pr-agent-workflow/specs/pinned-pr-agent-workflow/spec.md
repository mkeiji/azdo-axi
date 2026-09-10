## ADDED Requirements

### Requirement: PR Agent automation is unavailable

The repository SHALL NOT provide a GitHub Actions workflow that invokes `the-pr-agent/pr-agent`, and repository documentation and configuration SHALL NOT claim that PR Agent automation runs for pull requests.

#### Scenario: Pull request is opened or updated

- **WHEN** a pull request is opened or synchronized
- **THEN** no PR Agent workflow is triggered

## REMOVED Requirements

### Requirement: Constrained PR Agent workflow

**Reason**: The external PR Agent automation is no longer enabled for repository pull requests.

**Migration**: Use the repository's remaining pull-request checks and normal human review process.

### Requirement: Minimum permissions and review configuration

**Reason**: No PR Agent workflow remains to require credentials, permissions, or review configuration.

**Migration**: Remove any repository secret maintained solely for the PR Agent workflow according to repository secret-management procedures.

### Requirement: Secret setup and pinned revision maintenance are verifiable

**Reason**: The PR Agent action and its immutable revision are no longer used by this repository.

**Migration**: No workflow pin or secret setup is required for PR Agent automation.
