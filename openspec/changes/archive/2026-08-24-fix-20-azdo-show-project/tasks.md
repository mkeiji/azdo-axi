## 1. Show Route Compatibility

- [x] 1.1 Remove the unsupported `--project` argument pair from the `work-item show` Azure CLI argv while preserving organization, JSON, relationship, context, output, and error behavior.

## 2. Regression Coverage

- [x] 2.1 Add regression coverage asserting the show argv omits `--project` and retains supported arguments.
- [x] 2.2 Add regression coverage asserting a successful show response is normalized with the resolved project context and existing output behavior.
- [x] 2.3 Verify create, update, list, and query argv construction remains unchanged.

## 3. Validation

- [x] 3.1 Run formatting, type checks, and the complete test suite.
- [x] 3.2 Validate and archive the OpenSpec change after all implementation tasks pass.
