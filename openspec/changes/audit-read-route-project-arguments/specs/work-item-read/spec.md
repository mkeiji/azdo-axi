## MODIFIED Requirements

### Requirement: Structured Azure boundary and TOON output

The system SHALL invoke `az` with argv arguments and explicit JSON output, then serialize normalized result data as TOON at the command boundary. Operations SHALL be non-interactive and shall not accept or manage tokens. Each route SHALL pass only options supported by its underlying Azure CLI command while preserving the resolved organization and project context in wrapper behavior; routes that support an Azure project option SHALL continue to include it.

#### Scenario: Show-based routes use supported arguments

- **WHEN** a caller invokes `work-item show`, `work-item update`, or `work-item links` with valid organization and project context
- **THEN** every generated `az boards work-item show` request SHALL include the resolved organization and JSON output options, SHALL omit `--project`, and SHALL preserve the resolved project in wrapper context and normalized output

#### Scenario: Supported routes retain project arguments

- **WHEN** a caller invokes work-item create, list, or query with valid context
- **THEN** the generated Azure argv SHALL continue to include the resolved project without changing that route's existing argument order or behavior
