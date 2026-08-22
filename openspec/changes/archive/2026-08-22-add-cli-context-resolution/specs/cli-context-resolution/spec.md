## Purpose

Provides a safe, deterministic command boundary for Azure DevOps Boards automation before work-item operations are implemented.

## ADDED Requirements

### Requirement: Installable command surface

The system SHALL provide an installable `azdo-axi` command with routes for `context`, `work-item list`, `work-item show <id>`, `work-item create`, `work-item update <id>`, `work-item links <id>`, and `query --wiql <wiql>`.

#### Scenario: Routed command

- **WHEN** a caller invokes one of the supported command routes with valid route arguments
- **THEN** the system SHALL dispatch it through the Azure DevOps context preflight boundary without interactive input

#### Scenario: Unknown option

- **WHEN** a caller supplies an option not accepted by the selected route
- **THEN** the system SHALL fail before executing an Azure CLI command and identify the unsupported option

### Requirement: Azure CLI preflight

The system SHALL verify that an executable Azure CLI and usable Azure DevOps extension are available before a route requires Azure DevOps data.

#### Scenario: Azure CLI missing

- **WHEN** the Azure CLI executable cannot be run
- **THEN** the system SHALL fail with an actionable instruction to install or make the Azure CLI available

#### Scenario: Azure DevOps extension unavailable

- **WHEN** the Azure CLI does not report an enabled Azure DevOps extension
- **THEN** the system SHALL fail with an actionable instruction to install or enable that extension

### Requirement: Deterministic Azure DevOps context

The system SHALL resolve organization and project independently using explicit route options first, supported environment variables second, and Azure DevOps CLI defaults last.

#### Scenario: Explicit context precedence

- **WHEN** an organization or project option is provided with a different environment or CLI default value
- **THEN** the system SHALL use the explicit option for that context field

#### Scenario: Missing context

- **WHEN** either organization or project cannot be resolved from the configured sources
- **THEN** the system SHALL fail before an Azure DevOps operation with an actionable instruction to provide that field

#### Scenario: Ambiguous context

- **WHEN** a context source supplies multiple conflicting values for organization or project without an explicit selection
- **THEN** the system SHALL fail and require an explicit selection rather than choosing a target

### Requirement: Structured Azure CLI boundary

The system SHALL invoke Azure CLI commands non-interactively and request structured JSON results for all Azure CLI data reads.

#### Scenario: Context report

- **WHEN** a caller invokes `azdo-axi context` with a resolvable context
- **THEN** the system SHALL report the organization and project and SHALL include team or iteration scope when it affects the resolved result

#### Scenario: Delegated authentication

- **WHEN** an Azure CLI invocation requires authentication
- **THEN** the system SHALL rely only on the existing Azure CLI and Azure DevOps extension authentication configuration and SHALL not store, print, or manage credentials
