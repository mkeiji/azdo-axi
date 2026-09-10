## 1. Binary-safe attachment output

- [x] 1.1 Replace buffered Azure attachment retrieval with a file-targeted Azure CLI output operation while retaining unavailable-CLI handling.
- [x] 1.2 Reserve the caller-selected output path, invoke the binary-safe output operation, enforce the existing 64 MiB guard, and preserve normalized errors and redaction.

## 2. Regression coverage

- [x] 2.1 Update mocked attachment download coverage to verify file-targeted binary-safe output, unchanged output bytes, compact result metadata, and preserved failures.
- [x] 2.2 Validate the TypeScript and OpenSpec contracts for the correction.
