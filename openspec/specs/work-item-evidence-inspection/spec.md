# work-item-evidence-inspection Specification

## Purpose
Provide safe, read-only access to work-item discussion evidence and attachment files without exposing attachment bytes or Azure credentials in structured output.
## Requirements
### Requirement: Inspect bounded work-item discussion comments

The system SHALL provide `azdo-axi work-item comments <id>` to return comment ID, author, created and modified timestamps, and text for the resolved organization, project, and work-item ID. The command SHALL request a bounded page by default, accept a continuation token for a later page, and support explicit traversal of all available comment pages. It SHALL preserve any Azure DevOps continuation token in its output. Comment text SHALL use the existing bounded-text default unless the caller supplies `--full`.

#### Scenario: List a comment page

- **WHEN** a caller invokes `work-item comments <id>` with valid context
- **THEN** the system SHALL return compact comment metadata, bounded text, the exact target identity, and a continuation token when Azure DevOps supplies one

#### Scenario: Continue or traverse comments

- **WHEN** a caller supplies a continuation token or explicitly requests all comment pages
- **THEN** the system SHALL request the corresponding Azure DevOps pages and preserve the continuation behavior without duplicating comments

#### Scenario: Empty discussion

- **WHEN** Azure DevOps returns no comments for the requested work item
- **THEN** the system SHALL return a zero comment count with the exact target identity

### Requirement: List attachment metadata without content retrieval

The system SHALL provide `azdo-axi work-item attachments <id>` to return a bounded list of attachment relations for the resolved organization, project, and work-item ID. Each valid attachment entry SHALL identify a stable attachment ID or normalized URL and include filename, content type, size, and creation details when Azure DevOps supplies them. The command SHALL not fetch, print, return, or persist attachment binary content.

#### Scenario: List attachment evidence

- **WHEN** a work item contains valid attached-file relations
- **THEN** the system SHALL return only compact attachment metadata and the exact target identity

#### Scenario: Missing or malformed relations

- **WHEN** a work item has no relations or an attached-file relation lacks a usable attachment identifier
- **THEN** the system SHALL return an empty attachment list or a structured actionable error without downloading content

### Requirement: Explicit validated attachment download

The system SHALL provide `azdo-axi work-item attachment download <work-item-id> <attachment-id-or-url> --path <destination>` to write one listed attachment to a caller-selected local file path or directory. Before downloading, the system SHALL verify that the identifier names a relation on the requested work item and that any supplied URL belongs to the resolved organization and project. The command SHALL reconstruct a validated Azure DevOps attachment request rather than following an untrusted URL, and SHALL include the resolved project in that request's route parameters. Supported attachment responses SHALL be written through a binary-safe file output path without capture or formatting through command stdout. Successful structured output SHALL identify the target organization, project, work-item ID, attachment identifier, and local path, but SHALL not include attachment bytes or credentials. Azure attachment download failures SHALL preserve their structured error code and actionable guidance while redacting token-like values, including token assignments, authorization assignments, and bearer credentials. The command SHALL retain the 64 MiB attachment-size guard.

#### Scenario: Download a validated attachment

- **WHEN** a caller selects an attachment relation for a valid work item and a writable local destination
- **THEN** the system SHALL write unchanged supported attachment bytes to that destination through a binary-safe output path and return compact download metadata without binary content

#### Scenario: Reject a foreign attachment URL

- **WHEN** a caller supplies an attachment URL whose organization or project differs from the resolved target
- **THEN** the system SHALL return a structured validation error and SHALL not make an attachment download request

#### Scenario: Download failure

- **WHEN** Azure DevOps cannot return the selected attachment or the local destination cannot be written
- **THEN** the system SHALL return a structured actionable error without printing binary data or credentials

### Requirement: Read-only evidence request safety

Evidence-inspection commands SHALL validate positive work-item IDs and resolved context before requesting Azure DevOps, use non-interactive Azure CLI requests, and make no work-item mutations. Azure request failures, malformed paginated responses, unsupported attachment media types, and invalid local destinations SHALL use structured actionable errors.

#### Scenario: Unsupported evidence request

- **WHEN** a caller supplies an unsupported flag, invalid ID, invalid continuation request, or unsupported attachment media type
- **THEN** the system SHALL reject the request locally or return a structured actionable error before exposing content
