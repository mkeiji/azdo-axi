## 1. Planning and response contract

- [x] 1.1 Define the comments and attachment evidence behavior delta and verify it validates with `openspec validate comments-attachment-evidence --strict`
- [x] 1.2 Document the transport, metadata, validation, and atomic publication design and verify all required design sections are present

## 2. Comments and inline image inspection

- [x] 2.1 Use the `7.1-preview` comments invocation and normalize live/legacy envelopes with bounded continuation and deduplication; verify focused comments and pagination tests pass
- [x] 2.2 Extract supported inline image metadata without fetching bytes and preserve comment/ordinal linkage; verify HTML extraction tests pass

## 3. Attachment safety

- [x] 3.1 Resolve scoped attachment relations and stage downloads through unique temporary `--out-file` paths with cleanup and no-clobber publication; verify download and cleanup tests pass
- [x] 3.2 Enforce URL scope, media allowlisting, size limits, magic-byte/content validation, and diagnostic redaction; verify safety regression tests pass

## 4. Validation and delivery

- [x] 4.1 Run the complete test suite and TypeScript build, then inspect the complete diff against the target branch
- [ ] 4.2 Archive the OpenSpec change and run the required pipeline validation and publication workflow
