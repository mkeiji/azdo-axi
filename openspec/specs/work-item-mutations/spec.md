# work-item-mutations Specification

## Purpose
Provide safe, non-interactive Azure DevOps Boards work-item creation and updates for agents.
## Requirements
### Requirement: Create work items

The system SHALL provide `azdo-axi work-item create` for standard work-item types including epics, features, user stories, tasks, and bugs, and SHALL pass custom types through when explicitly requested. The system SHALL reject custom field input unless each `--field` value uses a non-empty Azure DevOps reference-name followed by `=`, before issuing any create request. Reference names may contain letters, numbers, underscores, and dots and SHALL preserve the supplied value, including additional `=` characters.

#### Scenario: Create a task with common fields

- **WHEN** a caller supplies a task type, title, description, parent ID, iteration, and assignee with valid organization and project context
- **THEN** the system SHALL invoke Azure CLI's work-item create operation with the resolved organization/project and corresponding standard fields, and SHALL return the created ID and resulting state

#### Scenario: Create with custom fields

- **WHEN** a caller supplies one or more explicit custom field reference-name/value pairs
- **THEN** the system SHALL include those fields in the Azure create payload without dropping or rewriting their names

#### Scenario: Create validation

- **WHEN** required type or title, field syntax, parent ID, or context is missing or invalid
- **THEN** the system SHALL fail before mutation and SHALL make no write request

#### Scenario: Invalid custom field is rejected before mutation

- **WHEN** a caller supplies `--field` without a valid reference name and equals separator
- **THEN** the system SHALL return a validation error and SHALL make no Azure write request

### Requirement: Update work items

The system SHALL provide `azdo-axi work-item update <id>` for common fields including title, description, state, tags, iteration, area, and assignment, and SHALL support explicit custom fields. The system SHALL apply the same custom-field reference-name validation to update payloads, including callers that use the exported payload builder directly. The generated Azure update request SHALL include the resolved organization and SHALL omit the project option because `az boards work-item update` does not support it. The wrapper SHALL continue to resolve and report the project in context and normalized results.

#### Scenario: Update a bug

- **WHEN** a caller updates a bug's state, tags, and assignee with valid context
- **THEN** the system SHALL read the target, issue an Azure update containing the requested changed fields without a project option, and return the target organization, project, ID, and resulting state

#### Scenario: Update uses supported Azure arguments

- **WHEN** a caller requests a changed state value for an accessible work item
- **THEN** the generated `az boards work-item update` request SHALL include the resolved organization, JSON output, and non-interactive error suppression options, and SHALL not include `--project`

#### Scenario: Already-satisfied update

- **WHEN** the requested update values match the target's current values and this can be determined from the Azure response
- **THEN** the system SHALL return success with `noOp: true` and SHALL not issue an update request

#### Scenario: Update validation and failures

- **WHEN** the ID, field input, context, authentication, or permission is invalid or Azure rejects the operation
- **THEN** the system SHALL return a structured actionable error and SHALL not conceal the selected organization or project

#### Scenario: Custom field value containing equals is preserved

- **WHEN** a caller supplies `--field Custom.Expression=a=b=c`
- **THEN** the system SHALL send `Custom.Expression=a=b=c` as one field assignment without rewriting the value

### Requirement: Mutation safety and output

Mutation routes SHALL be non-interactive, SHALL never select a different organization or project than the resolved context, SHALL not expose deletion without explicit confirmation, and SHALL return compact structured mutation output.

#### Scenario: Explicit target

- **WHEN** a caller provides organization and project flags
- **THEN** every Azure mutation and pre-read SHALL include exactly those values

#### Scenario: Mutation result contract

- **WHEN** create or update succeeds
- **THEN** output SHALL include operation, organization, project, work-item ID, no-op status, and resulting type/title/state when available

#### Scenario: Authentication delegation

- **WHEN** Azure CLI requires authentication
- **THEN** the wrapper SHALL report the normalized authentication failure and SHALL not store, print, or manage a token
