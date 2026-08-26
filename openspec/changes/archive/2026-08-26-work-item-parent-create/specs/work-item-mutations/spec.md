## MODIFIED Requirements

### Requirement: Create work items

The system SHALL provide `azdo-axi work-item create` for standard work-item types including epics, features, user stories, tasks, and bugs, and SHALL pass custom types through when explicitly requested. The system SHALL reject custom field input unless each `--field` value uses a non-empty Azure DevOps reference-name followed by `=`, before issuing any create request. Reference names may contain letters, numbers, underscores, and dots and SHALL preserve the supplied value, including additional `=` characters. When `--parent` is supplied, the system SHALL persist the created item's Azure DevOps hierarchy relation to that parent and SHALL verify the relation or resulting parent field before reporting success.

#### Scenario: Create a task with common fields

- **WHEN** a caller supplies a task type, title, description, parent ID, iteration, and assignee with valid organization and project context
- **THEN** the system SHALL invoke Azure CLI's work-item create operation with the resolved organization/project and corresponding standard fields, SHALL persist and verify the hierarchy relation to the parent ID, and SHALL return the created ID and resulting state

#### Scenario: Create without a parent

- **WHEN** a caller supplies a valid work-item type and title without a parent
- **THEN** the system SHALL issue the existing single create mutation without a relation mutation or parent verification read and SHALL return the created ID and resulting state

#### Scenario: Parent relation persistence failure

- **WHEN** the relation mutation for a requested parent fails
- **THEN** the system SHALL return the normalized Azure error and SHALL not report successful creation

#### Scenario: Parent relation verification failure

- **WHEN** the relation mutation completes but the created item does not show the requested parent relation or parent field during verification
- **THEN** the system SHALL return an actionable failure and SHALL not report successful creation

#### Scenario: Create with custom fields

- **WHEN** a caller supplies one or more explicit custom field reference-name/value pairs
- **THEN** the system SHALL include those fields in the Azure create payload without dropping or rewriting their names

#### Scenario: Create validation

- **WHEN** required type or title, field syntax, parent ID, or context is missing or invalid
- **THEN** the system SHALL fail before mutation and SHALL make no write request

#### Scenario: Invalid custom field is rejected before mutation

- **WHEN** a caller supplies `--field` without a valid reference name and equals separator
- **THEN** the system SHALL return a validation error and SHALL make no Azure write request
