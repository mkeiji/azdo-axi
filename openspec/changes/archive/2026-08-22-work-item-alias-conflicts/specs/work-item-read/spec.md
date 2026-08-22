# work-item-read Specification Delta

## MODIFIED Requirements

### Requirement: Safe validation and normalized failures

The system SHALL reject unknown or misspelled flags before making an Azure request and SHALL normalize Azure failures into concise structured errors with actionable suggestions. When a work-item list receives both spellings of an aliased filter, it SHALL reject the invocation before context resolution or Azure execution, regardless of whether the values are identical.

#### Scenario: Conflicting assignee aliases

- **WHEN** a caller supplies both `--assignee` and `--assigned-to` to `work-item list`
- **THEN** the command SHALL fail locally and identify the conflicting aliases without making an Azure request

#### Scenario: Unknown flag

- **WHEN** a caller supplies an unsupported list or show option
- **THEN** the command SHALL fail locally, identify the flag, and make no Azure request

#### Scenario: Azure failure

- **WHEN** Azure CLI reports an unavailable extension, authentication failure, permission failure, invalid context, or missing work item
- **THEN** the command SHALL emit a structured concise error code and a relevant remediation suggestion

#### Scenario: Conflicting area aliases

- **WHEN** a caller supplies both `--area` and `--area-path` to `work-item list`
- **THEN** the command SHALL fail locally and identify the conflicting aliases without making an Azure request
