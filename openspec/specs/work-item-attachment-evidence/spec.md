# work-item-attachment-evidence Specification

## Purpose
Safely exposes attachment evidence associated with work items and discussion comments without treating untrusted content as executable or readable application data.

## Requirements

### Requirement: Read-only attachment inventory

The system SHALL inventory `AttachedFile` work-item relations and supported Azure DevOps attachment references in discussion comment HTML without downloading attachment bytes. Inventory metadata SHALL contain a normalized credential-free attachment ID and URL, source (`relation` or `comment`), and a stable source ordinal; comment entries SHALL also contain the comment ID. The system SHALL recognize organization-scoped Azure DevOps attachment URLs whose project segment is either the configured project name or a GUID.

#### Scenario: Paginated comment references

- **WHEN** an explicitly paginated discussion listing contains supported duplicate and distinct attachment references
- **THEN** the output contains each reference once for its comment and ordinal with no attachment byte request

### Requirement: Explicit source-bound download

The system SHALL accept only a fresh selector returned by attachment inventory, re-fetch the requested work item and, for a comment selector, re-fetch and locate the selected comment before download. It SHALL reconstruct the Azure DevOps attachment request from the validated attachment ID and SHALL reject selectors, references, redirects, and URLs outside the resolved organization/project scope.

#### Scenario: Revalidation rejects removed comment reference

- **WHEN** a comment selector is no longer present in the requested work item's refreshed comments
- **THEN** the system rejects the download without requesting binary content

### Requirement: Safe document download and publication

The system SHALL download only explicitly selected, non-active image, PDF, DOCX/OOXML, Markdown, or plain-text evidence within the configured size limit. It SHALL validate declared media type, filename extension, and applicable reliable file signatures before atomically publishing a new destination file without overwriting an existing file, and SHALL remove staging files on success and failure. The system SHALL not return attachment bytes, signed query strings, credentials, or untrusted HTML in structured output.

#### Scenario: Content mismatch

- **WHEN** downloaded content conflicts with its declared permitted type or contains a disallowed active or renderable format
- **THEN** the system rejects the content and leaves neither a destination file nor a staging file
