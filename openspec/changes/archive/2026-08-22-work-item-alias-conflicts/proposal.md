## Why

The work-item list parser currently accepts canonical filter names and compatibility aliases but silently selects one when both aliases are supplied. This can hide caller mistakes and make the effective scope unclear.

## What Changes

- Reject `--assignee` combined with `--assigned-to`, regardless of whether values match.
- Reject `--area` combined with `--area-path`, regardless of whether values match.
- Report the conflicting option pair before context resolution or any Azure request.
- Add regression tests for both conflict pairs with identical and differing values.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `work-item-read`: Require deterministic rejection of conflicting filter aliases.

## Impact

Affected work-item argument parsing and regression tests. Existing single-option aliases and all read/query behavior remain unchanged.
