## Why

Work-item attachment inventory misses supported files embedded in discussion HTML, so agents cannot safely select the document and image evidence present in a work item. The download path must also preserve Azure DevOps scope and content safety for these newly discoverable references.

## What Changes

- Inventory supported Azure DevOps attachment references from both `AttachedFile` relations and paginated discussion comments without retrieving bytes.
- Expose credential-free source, ordinal, and attachment metadata for images and permitted document formats, including project-GUID Azure DevOps URLs.
- Require a fresh, source-bound selector and revalidate the work item/comment before reconstructing a trusted binary download request.
- Extend download validation to permitted PDF, OOXML/DOCX, Markdown, and plain-text content while rejecting active, executable, renderable, oversized, redirected, or mismatched content.
- Preserve atomic no-clobber publication and cleanup for all download paths.

## Capabilities

### New Capabilities

- `work-item-attachment-evidence`: Safe inventory and explicit download of work-item relation and discussion attachment evidence.

### Modified Capabilities

- None.

## Impact

- `src/work-items.ts` attachment parsing, comment output, secure download transport, and content validation.
- CLI documentation and regression coverage in `test/work-items.test.ts`.
- No new runtime dependencies or network operations during listing.
