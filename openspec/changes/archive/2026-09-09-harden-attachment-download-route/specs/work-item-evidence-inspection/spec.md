## MODIFIED Requirements

### Requirement: Explicit validated attachment download

The system SHALL provide `azdo-axi work-item attachment download <work-item-id> <attachment-id-or-url> --path <destination>` to write one listed attachment to a caller-selected local file path or directory. Before downloading, the system SHALL verify that the identifier names a relation on the requested work item and that any supplied URL belongs to the resolved organization and project. The command SHALL reconstruct a validated Azure DevOps attachment request rather than following an untrusted URL, and SHALL include the resolved project in that request's route parameters. Successful structured output SHALL identify the target organization, project, work-item ID, attachment identifier, and local path, but SHALL not include attachment bytes or credentials. Azure attachment download failures SHALL preserve their structured error code and actionable guidance while redacting token-like values, including token assignments, authorization assignments, and bearer credentials.

#### Scenario: Download a validated attachment

- **WHEN** a caller selects an attachment relation for a valid work item and a writable local destination
- **THEN** the system SHALL write the attachment binary to that destination and return compact download metadata without binary content

#### Scenario: Reject a foreign attachment URL

- **WHEN** a caller supplies an attachment URL whose organization or project differs from the resolved target
- **THEN** the system SHALL return a structured validation error and SHALL not make an attachment download request

#### Scenario: Download failure

- **WHEN** Azure DevOps cannot return the selected attachment or the local destination cannot be written
- **THEN** the system SHALL return a structured actionable error without printing binary data or credentials
