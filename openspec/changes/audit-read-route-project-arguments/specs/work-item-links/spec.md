## MODIFIED Requirements

### Requirement: Link lookup uses supported Azure arguments

The link inspection route SHALL request its work item through `az boards work-item show` with the resolved organization, relationship expansion, JSON output, and non-interactive error options, but SHALL omit `--project` because that show route does not support it. The wrapper SHALL continue to return the resolved project in context and scope.

#### Scenario: Inspect links without an Azure project option

- **WHEN** a caller invokes `work-item links <id>` with valid organization and project context
- **THEN** the generated show argv SHALL omit `--project`, and successful normalized output SHALL retain the resolved organization and project context plus link data
