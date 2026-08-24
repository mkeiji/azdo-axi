## 1. Route Compatibility Corrections

- [x] 1.1 Verify current Azure CLI route compatibility and document that only show-based `--project` arguments are in scope; leave create, list, and query project arguments unchanged.
- [x] 1.2 Pass `includeProject = false` explicitly for the update pre-read while preserving read-before-update, no-op detection, context resolution, and normalized output.
- [x] 1.3 Remove `--project` from the `work-item links` show argv while preserving organization, relation expansion, JSON output, error handling, and project context output.

## 2. Regression Coverage

- [x] 2.1 Add focused assertions that show, update pre-read, and links show argv omit `--project` and retain supported arguments.
- [x] 2.2 Assert update still performs its pre-read before a changed mutation and returns normalized project context, including no-op behavior.
- [x] 2.3 Assert create, list, and query continue to pass their resolved project arguments.

## 3. Validation and Delivery

- [ ] 3.1 Validate the OpenSpec change and run the repository-integrity and problem-fit checks required for this task.
- [ ] 3.2 Archive the completed OpenSpec change and commit the implementation and artifacts on the task branch.
