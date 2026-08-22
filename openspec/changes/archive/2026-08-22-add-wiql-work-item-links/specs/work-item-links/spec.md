## Purpose

Expose work-item relationships in a concise, stable form so agents can traverse parent, child, and related work items without parsing raw Azure DevOps responses.

## ADDED Requirements

### Requirement: Work-item link inspection

The system SHALL provide `azdo-axi work-item links <id>` and return links classified as parent, child, or related-item links, together with the resolved organization and project context.

#### Scenario: Map supported link types

- **WHEN** Azure DevOps returns parent, child, or related relationships for the requested work item
- **THEN** the output SHALL include each relationship's category, target identifier or URL when available, and relevant link metadata

#### Scenario: No relationships

- **WHEN** the requested work item has no relationships
- **THEN** the output SHALL report an explicit zero link count and the resolved organization and project scope

#### Scenario: Link lookup failure

- **WHEN** Azure DevOps cannot return the requested work item or denies access
- **THEN** the system SHALL emit the existing normalized not-found or permission error with an actionable suggestion

### Requirement: Preserve custom work-item data

The link and query outputs SHALL preserve custom work-item types and custom fields returned by Azure DevOps where practical, without requiring a fixed built-in type list.

#### Scenario: Custom type and fields

- **WHEN** Azure DevOps returns a custom work-item type or fields outside the standard field set
- **THEN** normalized output SHALL retain those values in a custom or fields collection rather than discarding them

### Requirement: Link argument safety

The system SHALL reject unsupported flags for link inspection before making an Azure request.

#### Scenario: Unknown link flag

- **WHEN** a caller supplies an unknown option to `work-item links`
- **THEN** the invocation SHALL fail locally and identify the unsupported option
