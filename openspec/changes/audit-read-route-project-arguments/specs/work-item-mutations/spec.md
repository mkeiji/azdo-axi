## MODIFIED Requirements

### Requirement: Update work items

The update route SHALL preserve its read-before-update flow, no-op detection, context resolution, and normalized output. Its pre-read SHALL invoke the supported `az boards work-item show` argument shape without `--project`, and its mutation request SHALL continue to omit `--project` as already required by the update command contract.

#### Scenario: Update pre-read uses supported show arguments

- **WHEN** a caller requests an update for an accessible work item
- **THEN** the pre-read SHALL include the work-item ID, resolved organization, relationship expansion, JSON output, and non-interactive error options, SHALL omit `--project`, and SHALL occur before any update request

#### Scenario: Update preserves no-op and context behavior

- **WHEN** requested values already match the pre-read item
- **THEN** the route SHALL return the existing normalized no-op result with resolved project context and SHALL not issue an update request
