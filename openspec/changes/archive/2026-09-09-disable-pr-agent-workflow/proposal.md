## Why

The PR Agent workflow invokes an external automated review action whenever a pull request is opened or updated. It must be disabled so pull requests no longer trigger that automation while preserving the repository's standard CI checks.

## What Changes

- Remove the `PR Agent` GitHub Actions workflow so it cannot run for pull-request events.
- Remove the associated workflow validation script and pull-request automation guidance from repository documentation.
- Update the PR Agent workflow capability specification to state that this automation is unavailable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pinned-pr-agent-workflow`: The repository no longer provides or actively documents the PR Agent pull-request workflow; archived OpenSpec records remain historical snapshots.

## Impact

Affected GitHub Actions configuration, its dedicated validation script, README automation guidance, and the corresponding OpenSpec capability. The unrelated CI workflow remains unchanged.
