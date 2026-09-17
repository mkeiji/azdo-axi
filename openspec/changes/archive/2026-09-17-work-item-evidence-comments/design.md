## Context

Comments currently parse only the legacy `value` envelope and downloads write directly to the destination through the runner abstraction. Evidence commands are read-only and already apply context and size guards.

## Goals / Non-Goals

**Goals:** normalize live comments, safely expose inline image references, and make downloads validated and atomic.

**Non-Goals:** changing work-item mutation APIs, downloading images during listing, or adding a general HTML/browser renderer.

## Decisions

- Accept the live and legacy comment envelope keys at one normalization boundary; retain the existing bounded page loop and deduplication.
- Represent inline images as compact metadata (`commentId`, ordinal, URL/reference) and validate references against the current fetched comment and context before download.
- Stage CLI output in a unique temporary file using `--out-file`, validate declared and detected content, then rename with exclusive publication semantics. This avoids stdout capture and destination clobbering.
- Allow only HTTPS Azure attachment routes and known raster image signatures/media types; reject active or ambiguous content before publication.

## Risks / Trade-offs

- Azure response variants may omit optional metadata → preserve compatible legacy keys but fail malformed required shapes.
- Content sniffing cannot identify every image format → allow only explicitly supported signatures and media types.
- A crash can leave a stage file → cleanup in `finally`, with unique names preventing destination impact.
