## Context

The existing evidence commands resolve work-item relations through Azure CLI and expose structured JSON. Comments use a paginated REST invocation, while binary attachment retrieval must remain separate from listing and must not allow untrusted content to overwrite local files.

## Goals / Non-Goals

**Goals:** Normalize Azure comment envelopes, preserve bounded continuation semantics, inventory safe inline image references, and stage/validate/publish attachment bytes safely.

**Non-Goals:** Downloading images during comment listing, changing work-item mutation APIs, or supporting arbitrary remote media and renderable formats.

## Decisions

- Keep `inlineImages` as separate metadata keyed by comment ID and zero-based ordinal; this preserves comment shape and ensures structured output contains no bytes.
- Accept `comments` and legacy `value` arrays and both continuation naming conventions, while using `7.1-preview` explicitly. Deduplicate by comment ID and image source identity across pages.
- Resolve and validate relations before download, then invoke Azure CLI with a unique pre-created `--out-file` path. Validate declared media, size, magic bytes, and HTML signatures before hard-linking to a new destination, so publication is atomic and cannot clobber an existing file.
- Enforce Azure organization/project URL scope and allow only supported attachment URL paths and raster image types; inline references are admitted only when present in the freshly fetched comment response.

## Risks / Trade-offs

- Azure may omit content metadata → downloaded bytes still undergo size and signature checks where a media type is declared.
- Concurrent destination creation can race publication → hard-link publication fails safely and removes the staged file.
- HTML parsing is intentionally narrow → only explicit HTTPS `<img src>` references are inventoried.
