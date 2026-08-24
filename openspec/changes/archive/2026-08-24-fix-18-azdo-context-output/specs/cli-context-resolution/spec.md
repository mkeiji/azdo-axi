## MODIFIED Requirements

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
