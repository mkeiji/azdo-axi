# work-item-read Specification Delta

## MODIFIED Requirements

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
