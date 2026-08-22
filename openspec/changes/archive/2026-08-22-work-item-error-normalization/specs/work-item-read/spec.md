# work-item-read Specification Delta

## MODIFIED Requirements

### Requirement: Safe validation and normalized failures

The system SHALL reject unknown or misspelled flags before making an Azure request and SHALL normalize Azure failures into concise structured errors with actionable suggestions. Permission-specific indicators SHALL take precedence over ambiguous not-found wording, including combined messages that say a resource does not exist or the caller lacks permission. Genuine not-found failures SHALL retain their existing error codes and context-check suggestion.

#### Scenario: Unknown flag

- **WHEN** a caller supplies an unsupported list or show option
- **THEN** the command SHALL fail locally, identify the flag, and make no Azure request

#### Scenario: Azure failure

- **WHEN** Azure CLI reports an unavailable extension, authentication failure, permission failure, invalid context, or missing work item
- **THEN** the command SHALL emit a structured concise error code and a relevant remediation suggestion

#### Scenario: Permission wording takes precedence

- **WHEN** an Azure error contains permission-specific wording, including a combined “does not exist or no permission” message
- **THEN** the command SHALL emit `AZ_PERMISSION_DENIED` with the existing permission remediation suggestion rather than a not-found code

#### Scenario: Genuine not-found wording

- **WHEN** an Azure error contains not-found wording without permission-specific indicators
- **THEN** the command SHALL retain the existing `WORK_ITEM_NOT_FOUND` or `AZ_RESOURCE_NOT_FOUND` code and context-check suggestion

#### Scenario: Conflicting assignee aliases

- **WHEN** a caller supplies both `--assignee` and `--assigned-to` to `work-item list`
- **THEN** the command SHALL fail locally and identify the conflicting aliases without making an Azure request

#### Scenario: Conflicting area aliases

- **WHEN** a caller supplies both `--area` and `--area-path` to `work-item list`
- **THEN** the command SHALL fail locally and identify the conflicting aliases without making an Azure request
