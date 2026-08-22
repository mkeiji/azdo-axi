# wiql-query Specification

## Purpose
Provide an advanced, read-only escape hatch for callers who need Azure DevOps work-item data beyond the built-in list and show filters.
## Requirements
### Requirement: Raw WIQL query route

The system SHALL provide `azdo-axi query --wiql <query>` and execute the supplied WIQL against the resolved organization and project using structured Azure CLI arguments and JSON output.

#### Scenario: Query results

- **WHEN** a caller supplies valid WIQL and a resolvable Azure DevOps context
- **THEN** the system SHALL return normalized query results with the context, applied query scope, explicit count, and available work-item fields including custom types and fields

#### Scenario: Empty query results

- **WHEN** valid WIQL returns no work items
- **THEN** the system SHALL report count `0` and explicitly include the resolved organization and project scope

#### Scenario: Query validation

- **WHEN** a caller omits `--wiql`, supplies a positional value, or uses an unknown flag
- **THEN** the system SHALL reject the invocation before Azure CLI is invoked and provide a usage suggestion

### Requirement: Query failure normalization

The system SHALL normalize Azure DevOps query failures into structured errors with actionable suggestions consistent with read-only work-item commands.

#### Scenario: Query authorization failure

- **WHEN** Azure DevOps rejects a query because of authentication or permissions
- **THEN** the system SHALL emit the corresponding normalized authentication or permission error and a remediation suggestion
