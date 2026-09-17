## Modified Requirements

### Requirement: Inspect bounded work-item discussion comments

The system SHALL request the installed Azure CLI-compatible `7.1-preview` comments API and normalize responses containing `comments`, `count`, `totalCount`, and `continuation_token` (as well as compatible legacy envelopes) into bounded comment output. Pagination SHALL preserve explicit continuation, `--all`, safe page limits, and deduplicate comments. Listing SHALL extract only supported image references from fetched comment HTML as metadata tied to its source comment and ordinal, without downloading image bytes or placing bytes in structured output.

#### Scenario: List a comment page

- **WHEN** a caller invokes `work-item comments <id>` with valid context
- **THEN** the system SHALL return compact comment metadata, bounded text, the exact target identity, and a continuation token when Azure DevOps supplies one

#### Scenario: Continue or traverse comments

- **WHEN** a caller supplies a continuation token or explicitly requests all comment pages
- **THEN** the system SHALL request the corresponding Azure DevOps pages and preserve the continuation behavior without duplicating comments

#### Scenario: Empty discussion

- **WHEN** Azure DevOps returns no comments for the requested work item
- **THEN** the system SHALL return a zero comment count with the exact target identity

#### Scenario: Live comments envelope

- **WHEN** Azure DevOps returns `comments`, `count`, `totalCount`, and `continuation_token`
- **THEN** the command SHALL return normalized comments and continuation metadata without requiring a `value` array

#### Scenario: Inline image inventory

- **WHEN** a comment contains supported HTTPS image references in its HTML
- **THEN** listing SHALL return ordinal metadata linked to that comment and SHALL not request image content

### Requirement: Explicit validated attachment download

Relation attachment downloads SHALL use `--out-file` to a unique non-existent temporary path, validate size, media type, magic bytes and content, atomically publish with no clobber, and clean up temporary or partial files on success and failure. Inline-image downloads SHALL be permitted only for a reference freshly listed for the requested work item and revalidated against the current comment. Requests SHALL enforce organization/project binding, supported Azure attachment URL shapes, image media allowlisting, streaming and size limits, and reject data, JavaScript, external, malformed, cross-scope, non-attachment, SVG, and HTML inputs.

#### Scenario: Download a validated attachment

- **WHEN** a caller selects an attachment relation for a valid work item and a writable local destination
- **THEN** the system SHALL write unchanged supported attachment bytes to that destination through a binary-safe output path and return compact download metadata without binary content

#### Scenario: Reject a foreign attachment URL

- **WHEN** a caller supplies an attachment URL whose organization or project differs from the resolved target
- **THEN** the system SHALL return a structured validation error and SHALL not make an attachment download request

#### Scenario: Download failure

- **WHEN** Azure DevOps cannot return the selected attachment or the local destination cannot be written
- **THEN** the system SHALL return a structured actionable error without printing binary data or credentials

#### Scenario: Atomic validated download

- **WHEN** a listed relation or freshly listed inline image is downloaded
- **THEN** the CLI SHALL write via a unique temporary `--out-file`, validate content, and publish without clobbering an existing destination

#### Scenario: Unsafe inline reference

- **WHEN** an inline reference is external, malformed, cross-scope, non-attachment, SVG, HTML, or stale
- **THEN** the command SHALL reject it before downloading
