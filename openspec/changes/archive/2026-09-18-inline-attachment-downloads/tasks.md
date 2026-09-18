## 1. Attachment inventory

- [x] 1.1 Normalize supported relation and comment HTML attachment references into credential-free source-bound metadata, including project-GUID paths, and verify listing tests make no binary request.
- [x] 1.2 Add comment envelope, pagination, duplicate-reference, and source-selector regression coverage and verify `npm test -- --run test/work-items.test.ts` passes.

## 2. Secure download

- [x] 2.1 Revalidate relation or comment selectors against refreshed Azure DevOps data and reconstruct the trusted attachment transport request; verify cross-scope and removed-selector tests reject before binary retrieval.
- [x] 2.2 Extend allowlisted document validation and atomic staged publication for PDF, DOCX, Markdown, and plain text; verify mismatch, limit, cleanup, and no-clobber regressions pass.

## 3. Delivery documentation

- [x] 3.1 Document source-bound inline attachment selection and document safety boundaries in README and verify formatting and type checking pass.
- [x] 3.2 Complete OpenSpec task tracking, validate and archive the change, and verify `openspec validate inline-attachment-downloads --strict` succeeds before archival.
