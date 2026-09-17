# Change: work-item-evidence-inspection

## MODIFIED Requirements

### Requirement: Inspect bounded work-item discussion comments

The system SHALL request the installed Azure CLI-compatible `7.1-preview` comments API, normalize live envelopes containing `comments`, `count`, `totalCount`, and `continuation_token` (plus compatible legacy envelopes), preserve bounded pagination, explicit continuation, `--all`, and comment deduplication, and return bounded comment metadata. Listing SHALL extract only supported HTTPS image references from fetched comment HTML into separate metadata linked to the source comment and ordinal, without downloading or embedding image bytes.

#### Scenario: List a comment page
- **WHEN** a caller invokes bounded work-item comments with valid context
- **THEN** normalized compact comments and any continuation token are returned with exact target identity

#### Scenario: Continue or traverse comments
- **WHEN** a caller supplies continuation or requests all pages
- **THEN** corresponding bounded pages are requested without duplicate comments

#### Scenario: Empty discussion
- **WHEN** Azure DevOps returns no comments
- **THEN** a zero-count result with exact target identity is returned

#### Scenario: Live comments envelope
- **WHEN** the response contains `comments`, `count`, `totalCount`, and `continuation_token`
- **THEN** comments and continuation metadata are normalized without requiring `value`

#### Scenario: Inline image inventory
- **WHEN** fetched comment HTML contains supported HTTPS image references
- **THEN** ordinal metadata tied to its comment is returned without an image-content request

### Requirement: Explicit validated attachment download

Relation attachment downloads SHALL use `--out-file` to a unique non-existent temporary path, enforce size and streaming limits, validate allowlisted media and magic bytes/content, atomically publish without clobbering, and clean up temporary or partial files on success or failure. Inline-image downloads SHALL be allowed only for a reference freshly listed for the requested work item and revalidated against the current comment. Requests SHALL enforce organization/project binding and reject data, JavaScript, external, malformed, cross-scope, non-attachment, SVG, and HTML inputs.

#### Scenario: Download a validated attachment
- **WHEN** a selected relation is valid and destination writable
- **THEN** supported bytes are staged, validated, and published with compact metadata only

#### Scenario: Reject a foreign attachment URL
- **WHEN** an attachment URL differs in organization or project
- **THEN** validation fails before download

#### Scenario: Download failure
- **WHEN** Azure or local publication fails
- **THEN** a structured error is returned and staged/partial files are removed

#### Scenario: Atomic validated download
- **WHEN** a listed relation or freshly listed inline image is downloaded
- **THEN** a unique temporary output is validated and published without clobbering

#### Scenario: Unsafe inline reference
- **WHEN** an inline reference is external, malformed, cross-scope, non-attachment, SVG, HTML, or stale
- **THEN** it is rejected before downloading

### Requirement: Read-only evidence request safety

Evidence inspection SHALL continue to validate IDs and context, use non-interactive Azure CLI requests, avoid mutations, and return structured redacted errors for Azure failures, malformed responses, unsupported media, and invalid destinations.

#### Scenario: Unsupported evidence request
- **WHEN** an invalid ID, unsupported flag, malformed response, media type, or destination is supplied
- **THEN** the request is rejected safely with actionable structured output
