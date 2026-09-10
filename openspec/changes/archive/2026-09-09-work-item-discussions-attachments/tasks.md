## 1. Evidence command surface

- [x] 1.1 Add validated comments, attachment listing, and explicit attachment-download invocation routes, flags, and help text.
- [x] 1.2 Add Azure DevOps comments pagination requests and compact bounded comment normalization.

## 2. Attachment evidence handling

- [x] 2.1 Normalize bounded attached-file relation metadata and reject malformed attachment relations.
- [x] 2.2 Implement relation-bound, organization/project-validated binary download to a caller-selected safe local destination.
- [x] 2.3 Add structured actionable failures for malformed pages, foreign URLs, unsupported media, filesystem errors, and binary download failures.

## 3. Regression coverage and documentation

- [x] 3.1 Add mocked tests for comments, empty discussions, pagination, text bounds, attachment metadata, URL normalization, and download handling.
- [x] 3.2 Add an integration-style contract test proving attachment listings never invoke binary retrieval.
- [x] 3.3 Document safe read-only evidence inspection commands and output boundaries.

## 4. Completion

- [x] 4.1 Validate the OpenSpec change, archive it, and verify the archived specifications and task record.
