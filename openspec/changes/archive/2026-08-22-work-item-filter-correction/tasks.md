## 1. Planning and contracts

- [x] 1.1 Define the supported WIQL-backed list filtering correction and regression scenarios.

## 2. Query implementation

- [x] 2.1 Build escaped WIQL predicates for active Tasks, assignee, iteration, and area while preserving resolved scope.
- [x] 2.2 Replace unsupported list argv flags with `az boards query` JSON invocation and existing concise normalization.

## 3. Verification

- [x] 3.1 Add regression tests for explicit iteration and area filters, context iteration fallback, empty results, and query argv formatting.
- [x] 3.2 Build and validate the OpenSpec change.
