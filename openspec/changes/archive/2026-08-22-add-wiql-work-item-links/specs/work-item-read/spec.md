## MODIFIED Requirements

### Requirement: Read-only work-item routes

The system SHALL provide `azdo-axi work-item list`, `azdo-axi work-item show <id>`, and `azdo-axi work-item links <id>` without creating, updating, or linking work items.

#### Scenario: List work items

- **WHEN** a caller invokes `work-item list` with valid context
- **THEN** the system SHALL request Azure DevOps work items and emit concise TOON containing a count, applied scope, and default fields ID, type, title, state, and assignee

#### Scenario: Show a work item

- **WHEN** a caller invokes `work-item show <id>` with valid context
- **THEN** the system SHALL emit TOON containing context plus available description, acceptance criteria, area, iteration, tags, estimates, assignee, and relationships

#### Scenario: Inspect work-item links

- **WHEN** a caller invokes `work-item links <id>` with valid context
- **THEN** the system SHALL request the work item with relationships expanded and emit TOON containing context, an explicit link count, and parent, child, or related links

### Requirement: Context-aware list filtering

The list operation SHALL default to active Task work items and SHALL support filtering by assignee, iteration, and area path, using context values when those filters are not explicitly provided. The Azure request SHALL use the supported WIQL query route rather than unsupported `az boards work-item list` iteration or area options.

#### Scenario: Filter by user and scope

- **WHEN** a caller supplies an assignee, iteration, or area filter (or the corresponding resolved context)
- **THEN** the Azure request SHALL invoke the supported WIQL query route with predicates for the selected values and the output SHALL identify the applied scope

#### Scenario: Empty filtered result

- **WHEN** no work items match the applied filters
- **THEN** the system SHALL emit count `0` and explicitly report organization, project, and relevant team/iteration/filter scope

#### Scenario: Iteration and area query filters

- **WHEN** a caller supplies `--iteration <path>` and/or `--area <path>` to `work-item list`
- **THEN** the generated WIQL SHALL include equality predicates on `System.IterationPath` and/or `System.AreaPath`, and the Azure argv SHALL pass the query to `az boards query` with JSON output

### Requirement: Structured Azure boundary and TOON output

The system SHALL invoke `az` with argv arguments and explicit JSON output, then serialize normalized result data as TOON at the command boundary. Operations SHALL be non-interactive and shall not accept or manage tokens.

#### Scenario: Structured request

- **WHEN** list, show, links, or query reads Azure DevOps
- **THEN** every Azure data request SHALL request JSON and include the resolved organization and project without shell interpolation

### Requirement: Bounded detail output

The system SHALL truncate large descriptions and history by default, report original sizes, and support `--full` to return untruncated content.

#### Scenario: Default truncation

- **WHEN** a shown work item contains oversized description or history
- **THEN** output SHALL be bounded and SHALL include original size and truncation metadata

#### Scenario: Full detail

- **WHEN** a caller supplies `--full`
- **THEN** the output SHALL retain the complete available description and history

### Requirement: Safe validation and normalized failures

The system SHALL reject unknown or misspelled flags before making an Azure request and SHALL normalize Azure failures into concise structured errors with actionable suggestions. Permission-specific indicators SHALL take precedence over ambiguous not-found wording, including combined messages that say a resource does not exist or the caller lacks permission. Genuine not-found failures SHALL retain their existing error codes and context-check suggestion.

#### Scenario: Unknown flag

- **WHEN** a caller supplies an unsupported list, show, or links option
- **THEN** the command SHALL fail locally, identify the flag, and make no Azure request

#### Scenario: Azure failure

- **WHEN** Azure CLI reports an unavailable extension, authentication failure, permission failure, invalid context, or missing work item
- **THEN** the command SHALL emit a structured concise error code and a relevant remediation suggestion

#### Scenario: Permission wording takes precedence

- **WHEN** an Azure error contains permission-specific wording, including a combined “does not exist or no permission” message
- **THEN** the command SHALL emit `AZ_PERMISSION_DENIED` with the existing permission remediation suggestion rather than a not-found code

#### Scenario: Genuine not-found wording

- **WHEN** an Azure error contains not-found wording without permission-specific indicators
- **THEN** the command SHALL retain the existing `WORK_ITEM_NOT_FOUND` or `AZ_RESOURCE_NOT_FOUND` code and context-check suggestion

#### Scenario: Conflicting assignee aliases

- **WHEN** a caller supplies both `--assignee` and `--assigned-to` to `work-item list`
- **THEN** the command SHALL fail locally and identify the conflicting aliases without making an Azure request

#### Scenario: Conflicting area aliases

- **WHEN** a caller supplies both `--area` and `--area-path` to `work-item list`
- **THEN** the command SHALL fail locally and identify the conflicting aliases without making an Azure request
