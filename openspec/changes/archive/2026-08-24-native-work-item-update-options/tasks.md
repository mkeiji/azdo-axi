## 1. Specification and payload design

- [x] 1.1 Validate the OpenSpec proposal and delta specification for native standard update flags and safe Azure diagnostics
- [x] 1.2 Define the update argument mapping and bounded stderr handling in the implementation design

## 2. Update implementation

- [x] 2.1 Map standard title, description, state, assignee, area, and iteration updates to Azure CLI native flags while keeping remaining validated assignments under `--fields`
- [x] 2.2 Include safe bounded Azure CLI stderr details in normalized mutation failures without changing actionable error classification or context handling

## 3. Regression coverage

- [x] 3.1 Add direct argument-construction coverage for all native standard options and custom fields
- [x] 3.2 Cover read-before-update no-op behavior and successful state-update response normalization, including the reported end-user path where feasible
- [x] 3.3 Run the applicable tests and verify the complete diff

## 4. Release artifacts

- [x] 4.1 Archive the completed OpenSpec change and update durable project notes only if new project-intrinsic knowledge was discovered
- [x] 4.2 Commit the implementation and OpenSpec artifacts on the task branch
