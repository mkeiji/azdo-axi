## MODIFIED Requirements

### Requirement: Read-only work-item routes

The system SHALL provide `azdo-axi work-item list`, `azdo-axi work-item show <id>`, `azdo-axi work-item links <id>`, `azdo-axi work-item comments <id>`, and `azdo-axi work-item attachments <id>` without creating, updating, linking, or downloading work-item data.

#### Scenario: List work items

- **WHEN** a caller invokes `work-item list` with valid context
- **THEN** the system SHALL request Azure DevOps work items and emit concise TOON containing a count, applied scope, and default fields ID, type, title, state, and assignee

#### Scenario: Show a work item

- **WHEN** a caller invokes `work-item show <id>` with valid context
- **THEN** the system SHALL emit TOON containing context plus available description, acceptance criteria, area, iteration, tags, estimates, assignee, and relationships

#### Scenario: Inspect work-item links

- **WHEN** a caller invokes `work-item links <id>` with valid context
- **THEN** the system SHALL request the work item with relationships expanded and emit TOON containing context, an explicit link count, and parent, child, or related links

#### Scenario: Inspect work-item evidence

- **WHEN** a caller invokes `work-item comments <id>` or `work-item attachments <id>` with valid context
- **THEN** the system SHALL emit concise TOON with the resolved context, exact work-item ID, and evidence metadata without attachment binary content

### Requirement: Bounded detail output

The system SHALL truncate large descriptions, history, and discussion comment text by default, report original sizes, and support `--full` to return untruncated available text. Read-only list commands SHALL use bounded default result sets and expose explicit pagination or traversal controls where Azure DevOps provides pagination.

#### Scenario: Default truncation

- **WHEN** a shown work item or returned discussion comment contains oversized text
- **THEN** output SHALL be bounded and SHALL include original sizes and truncation metadata

#### Scenario: Full detail

- **WHEN** a caller supplies `--full`
- **THEN** the output SHALL retain the complete available description, history, or discussion comment text

#### Scenario: Bounded evidence page

- **WHEN** a caller invokes an evidence listing without an explicit traversal request
- **THEN** the system SHALL return a bounded result set and expose Azure DevOps continuation information when additional comments are available
