## 1. Planning and domain contracts

- [x] 1.1 Define read-only work-item result, scope, truncation, and normalized error contracts.
- [x] 1.2 Extend the CLI-context specification with read operation and JSON boundary requirements.

## 2. Parsing and Azure adapter

- [x] 2.1 Add allowlisted list/show flags, including filters and `--full`, with pre-request validation.
- [x] 2.2 Implement structured Azure Boards list/show requests and normalize Azure failures.
- [x] 2.3 Implement context-aware active-task filtering and stable field mapping.

## 3. Output and command integration

- [x] 3.1 Implement bounded detail/history formatting and TOON serialization at the CLI boundary.
- [x] 3.2 Route list/show handlers through resolved context while preserving existing routes and authentication behavior.
- [x] 3.3 Update help and README usage for the available read-only operations.

## 4. Verification

- [x] 4.1 Add tests for filtering, request formatting, default fields, details, relationships, and TOON output.
- [x] 4.2 Add tests for truncation/full output, empty scope, flag validation, and normalized failures.
- [x] 4.3 Build and validate the OpenSpec change.
