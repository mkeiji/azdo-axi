# cli-context-resolution Specification Delta

## MODIFIED Requirements

### Requirement: Installable command surface

The system SHALL provide an installable `azdo-axi` command with routes for `context`, read-only `work-item list`, read-only `work-item show <id>`, `work-item create`, `work-item update <id>`, `work-item links <id>`, and `query --wiql <wiql>`. The read-only routes SHALL execute their Azure DevOps data operation after deterministic context resolution; mutation and query routes may remain unavailable until separately implemented.

#### Scenario: Routed command

- **WHEN** a caller invokes one of the supported command routes with valid route arguments
- **THEN** the system SHALL dispatch it through the Azure DevOps context preflight boundary without interactive input

#### Scenario: Unknown option

- **WHEN** a caller supplies an option not accepted by the selected route
- **THEN** the system SHALL fail before executing an Azure CLI command and identify the unsupported option

#### Scenario: Unexpected positional argument

- **WHEN** a caller supplies a positional argument to a route that defines no positional arguments
- **THEN** the system SHALL fail before executing an Azure CLI command and identify the unexpected argument

#### Scenario: Clean package installation

- **WHEN** a package is packed from a checkout with no existing `dist` directory and then installed
- **THEN** the installed `azdo-axi` command SHALL be invocable

#### Scenario: Routed read operation

- **WHEN** a caller invokes `work-item list` or `work-item show <id>` with valid route arguments
- **THEN** the system SHALL dispatch it through context resolution and a non-interactive structured Azure DevOps read

### Requirement: Structured Azure CLI boundary

The system SHALL invoke Azure CLI commands non-interactively and request structured JSON results for all Azure CLI data reads, including work-item list and show operations.

#### Scenario: Context report

- **WHEN** a caller invokes `azdo-axi context` with a resolvable context
- **THEN** the system SHALL report the organization and project and SHALL include team or iteration scope when it affects the resolved result

#### Scenario: Delegated authentication

- **WHEN** an Azure CLI invocation requires authentication
- **THEN** the system SHALL rely only on the existing Azure CLI and Azure DevOps extension authentication configuration and SHALL not store, print, or manage credentials

#### Scenario: Work-item JSON request

- **WHEN** a caller invokes a read-only work-item route with a resolvable context
- **THEN** the system SHALL pass organization and project as structured command arguments, request JSON output, and serialize only normalized data at the CLI output boundary
