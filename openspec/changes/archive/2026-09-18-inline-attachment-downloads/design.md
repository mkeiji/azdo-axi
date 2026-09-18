## Context

The existing evidence commands read relation metadata and comment pages through Azure DevOps JSON endpoints, while binary retrieval is staged to a local file. See proposal.md and the attachment evidence specification for the required behavior.

## Goals / Non-Goals

**Goals:**

- Give relation and comment references one normalized, credential-free metadata model.
- Bind download selectors to a source and ordinal, then independently refresh that source before a binary request.
- Treat downloaded bytes as opaque data validated only by bounded signature and text safety checks.

**Non-Goals:**

- Rendering, converting, extracting, indexing, executing, or sending attachment content to another service.
- Supporting arbitrary web links, redirects, Office legacy binary formats, or active/renderable media.

## Decisions

- Use opaque serialized selectors with source, attachment ID, comment ID where applicable, and ordinal. This prevents an ID alone from claiming a comment origin. Existing relation IDs remain accepted for compatibility, while comment downloads require the fresh listing selector.
- Parse only HTTPS Azure DevOps attachment paths and discard query strings. Project GUID segments are accepted because Azure DevOps can emit them; the authenticated work-item/comment refresh remains the authoritative scope proof.
- Reconstruct the binary request from the revalidated attachment ID with the Azure DevOps resource target used for direct attachment downloads rather than using the HTML URL. This avoids signed URL exposure and redirects.
- Permit an allowlist of images and documents only when metadata and bytes agree. PDF uses its header, DOCX uses ZIP/OOXML markers, and text formats reject binary controls and HTML/script prefixes. Legacy DOC is rejected because its binary format cannot be safely distinguished with the required reliable signature policy.
- Reserve a unique temporary sibling file, validate it, then hard-link it to the destination. Linking preserves atomic no-clobber publication; cleanup runs in a `finally` path.

## Risks / Trade-offs

- [Azure comments have varied envelope shapes] → Accept the documented `comments`/`value` envelopes and continuation aliases while rejecting malformed records.
- [DOCX ZIP inspection can be malformed] → Read only bounded container bytes and require OOXML paths; reject unreadable containers.
- [Unknown document MIME metadata] → Require a recognized extension and corresponding safe content validation rather than guessing.

## Migration Plan

The listing response adds attachment metadata and selectors without changing existing comment or relation fields. Existing relation-ID download callers continue to work; users select inline evidence by its newly listed selector. Rollback is source reversion with no persistent data migration.
