# cli-context-resolution Specification

## Purpose
Provides a safe, deterministic command boundary for Azure DevOps Boards automation before work-item operations are implemented.
## Requirements
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

### Requirement: Azure CLI preflight

The system SHALL verify that an executable Azure CLI and usable Azure DevOps extension are available before a route requires Azure DevOps data.

#### Scenario: Azure CLI missing

- **WHEN** the Azure CLI executable cannot be run
- **THEN** the system SHALL fail with an actionable instruction to install or make the Azure CLI available

#### Scenario: Azure DevOps extension unavailable

- **WHEN** the Azure CLI does not report an enabled Azure DevOps extension
- **THEN** the system SHALL fail with an actionable instruction to install or enable that extension

### Requirement: Deterministic Azure DevOps context

The system SHALL resolve organization and project independently using explicit route options first, supported environment variables second, and Azure DevOps CLI defaults last. It SHALL request Azure DevOps CLI defaults only when at least one organization, project, team, or iteration field remains unresolved by the higher-precedence sources. It SHALL accept defaults returned as JSON or as a well-formed INI-style `[defaults]` section, and SHALL reject malformed or ambiguous defaults rather than selecting a value.

#### Scenario: Explicit context precedence

- **WHEN** an organization or project option is provided with a different environment or CLI default value
- **THEN** the system SHALL use the explicit option for that context field

#### Scenario: Complete explicit context

- **WHEN** organization, project, team, and iteration are each supplied as route options
- **THEN** the system SHALL resolve the context without querying Azure DevOps CLI defaults

#### Scenario: Mixed explicit and default context

- **WHEN** one or more context fields are unresolved after route options and environment variables are evaluated
- **THEN** the system SHALL query Azure DevOps CLI defaults only for the unresolved fields while retaining higher-precedence values for the other fields

#### Scenario: INI-style CLI defaults

- **WHEN** Azure DevOps CLI defaults are emitted in a well-formed `[defaults]` INI-style section
- **THEN** the system SHALL resolve the available context values from that section

#### Scenario: Malformed or ambiguous CLI defaults

- **WHEN** Azure DevOps CLI defaults output is malformed or supplies conflicting values for a context field
- **THEN** the system SHALL fail with an actionable output or context ambiguity error without selecting a target

#### Scenario: Missing context

- **WHEN** either organization or project cannot be resolved from the configured sources
- **THEN** the system SHALL fail before an Azure DevOps operation with an actionable instruction to provide that field

#### Scenario: Ambiguous context

- **WHEN** a context source supplies multiple conflicting values for organization or project without an explicit selection
- **THEN** the system SHALL fail and require an explicit selection rather than choosing a target

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
