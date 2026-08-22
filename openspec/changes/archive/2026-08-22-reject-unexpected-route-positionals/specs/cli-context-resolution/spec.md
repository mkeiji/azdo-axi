## MODIFIED Requirements

### Requirement: Installable command surface

The system SHALL provide an installable `azdo-axi` command with routes for `context`, `work-item list`, `work-item show <id>`, `work-item create`, `work-item update <id>`, `work-item links <id>`, and `query --wiql <wiql>`. A package packed from a clean checkout SHALL include the declared command executable and its distribution dependencies.

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
