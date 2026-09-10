# pinned-pr-agent-workflow Specification

## Purpose

Records that the repository does not provide the external PR Agent automation for pull-request review.

## Requirements

### Requirement: PR Agent automation is unavailable

The repository SHALL NOT provide a GitHub Actions workflow that invokes `the-pr-agent/pr-agent`, and repository documentation and configuration SHALL NOT claim that PR Agent automation runs for pull requests.

#### Scenario: Pull request is opened or updated

- **WHEN** a pull request is opened or synchronized
- **THEN** no PR Agent workflow is triggered
