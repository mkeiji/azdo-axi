## 1. Planning and specification

- [x] 1.1 Validate the security change proposal, design, and delta specification.

## 2. Sanitizer correction

- [x] 2.1 Extend bounded Azure CLI stderr redaction to cover generic quoted JSON credential properties while preserving existing formats.
- [x] 2.2 Add regression coverage for token/password JSON leaks and compare the corrected path with existing bearer, explicit-token, and assignment redaction paths.

## 3. Validation and release artifacts

- [x] 3.1 Run focused tests and inspect the complete diff against the PR target branch.
- [x] 3.2 Archive the completed OpenSpec change and update durable project notes only if new project-intrinsic knowledge was discovered.
- [x] 3.3 Commit the focused security fix on the task branch.
