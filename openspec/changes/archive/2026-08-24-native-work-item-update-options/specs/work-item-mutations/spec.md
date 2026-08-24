## MODIFIED Requirements

### Requirement: Update work items

The system SHALL provide `azdo-axi work-item update <id>` for common fields including title, description, state, tags, iteration, area, and assignment, and SHALL support explicit custom fields. The system SHALL apply the same custom-field reference-name validation to update payloads, including callers that use the exported payload builder directly. Standard title, description, state, assignee, area, and iteration values SHALL be sent using Azure CLI's corresponding native options (`--title`, `--description`, `--state`, `--assigned-to`, `--area`, and `--iteration`); `--fields` SHALL contain only genuinely custom Azure DevOps fields. The generated Azure update request SHALL include the resolved organization and SHALL omit the project option because `az boards work-item update` does not support it. The wrapper SHALL continue to resolve and report the project in context and normalized results.

#### Scenario: Update a bug

- **WHEN** a caller updates a bug's state, tags, and assignee with valid context
- **THEN** the system SHALL read the target, issue an Azure update containing the requested changed fields without a project option, and return the target organization, project, ID, and resulting state

#### Scenario: Update uses supported Azure arguments

- **WHEN** a caller requests a changed state value for an accessible work item
- **THEN** the generated `az boards work-item update` request SHALL include the resolved organization, JSON output, and non-interactive error suppression options, and SHALL not include `--project`

#### Scenario: Update uses native Azure arguments

- **WHEN** a caller requests changed title, description, state, assignee, area, and iteration values for an accessible work item
- **THEN** the generated `az boards work-item update` request SHALL include `--title`, `--description`, `--state`, `--assigned-to`, `--area`, and `--iteration` with those values, and SHALL not encode those values as `--fields` assignments

#### Scenario: Custom fields use the fields option

- **WHEN** a caller requests a changed custom field value
- **THEN** the generated Azure update request SHALL include the validated custom assignment under `--fields` without rewriting its reference name or value

#### Scenario: Already-satisfied update

- **WHEN** the requested update values match the target's current values and this can be determined from the Azure response
- **THEN** the system SHALL return success with `noOp: true` and SHALL not issue an update request

#### Scenario: Update validation and failures

- **WHEN** the ID, field input, context, authentication, or permission is invalid or Azure rejects the operation
- **THEN** the system SHALL return a structured actionable error, SHALL include safe diagnostic details from Azure CLI stderr when available, and SHALL not conceal the selected organization or project

#### Scenario: Custom field value containing equals is preserved

- **WHEN** a caller supplies `--field Custom.Expression=a=b=c`
- **THEN** the system SHALL send `Custom.Expression=a=b=c` as one field assignment without rewriting the value
