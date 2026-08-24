## MODIFIED Requirements

### Requirement: Structured Azure boundary and TOON output

The system SHALL invoke `az` with argv arguments and explicit JSON output, then serialize normalized result data as TOON at the command boundary. Operations SHALL be non-interactive and shall not accept or manage tokens. Each route SHALL pass only options supported by its underlying Azure CLI command while preserving the resolved organization and project context in wrapper behavior; routes that support an Azure project option SHALL continue to include it.

#### Scenario: Structured request

- **WHEN** list, show, links, or query reads Azure DevOps
- **THEN** every Azure data request SHALL request JSON and include the resolved organization, and SHALL include the resolved project in the Azure argv when the underlying route supports `--project`

#### Scenario: Show uses supported Azure arguments

- **WHEN** a caller invokes `work-item show <id>` with valid organization and project context
- **THEN** the generated `az boards work-item show` argv SHALL include the resolved organization and JSON output options, SHALL omit `--project`, and the wrapper SHALL retain the resolved project in its context and output

#### Scenario: Update uses supported Azure arguments

- **WHEN** a caller invokes `work-item update <id>` with valid organization and project context and a changed field value
- **THEN** the generated `az boards work-item update` argv SHALL include the resolved organization and JSON output options, SHALL omit `--project`, and the wrapper SHALL retain the resolved project in its context and output

#### Scenario: Other routes retain project arguments

- **WHEN** a caller invokes a route whose underlying Azure command supports `--project`, including work-item create, list, or query
- **THEN** the generated Azure argv SHALL continue to include the resolved project without changing that route's existing argument order or behavior

#### Scenario: Show-based routes use supported arguments

- **WHEN** a caller invokes `work-item show`, `work-item update`, or `work-item links` with valid organization and project context
- **THEN** every generated `az boards work-item show` request SHALL include the resolved organization and JSON output options, SHALL omit `--project`, and SHALL preserve the resolved project in wrapper context and normalized output

#### Scenario: Supported routes retain project arguments

- **WHEN** a caller invokes work-item create, list, or query with valid context
- **THEN** the generated Azure argv SHALL continue to include the resolved project without changing that route's existing argument order or behavior
