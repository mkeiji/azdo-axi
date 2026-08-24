## 1. Update argument construction

- [x] 1.1 Remove the unsupported `--project` argument pair from the `work-item update` Azure argv while preserving organization, JSON output, non-interactive flags, field validation, and argument order.

## 2. Regression coverage

- [x] 2.1 Assert the update argv omits `--project` while the pre-update read retains its existing context behavior and supported routes retain project arguments.
- [x] 2.2 Exercise a changed state update with distinct pre-read and update responses, and assert successful result normalization including the resulting state, organization, project, and ID.
- [x] 2.3 Run the focused and full test suites and validate the OpenSpec change.
