## Context

Existing reads normalize JSON returned by Azure CLI and use a `CommandRunner` test seam. Work-item relationships already expose attached-file relations, while comments require the Azure DevOps WIT comments REST route. See proposal.md and the evidence-inspection delta specs for required behavior.

## Goals / Non-Goals

**Goals:**

- Add small, independently bounded comments and attachment-list commands.
- Reuse resolved context and work-item relation lookup to bind a download to the requested work item.
- Keep attachment bytes outside the normal JSON/TOON result path.

**Non-Goals:**

- Uploading, deleting, editing, or otherwise mutating comments or attachments.
- Rendering attachment content, persisting credentials, or adding a general URL downloader.

## Decisions

### Separate evidence routes

Use `work-item comments <id>`, `work-item attachments <id>`, and `work-item attachment download <work-item-id> <attachment-id-or-url> --path <destination>`. This keeps metadata reads side-effect free and makes download intent, work-item binding, and output destination explicit. A combined `show --evidence` alternative would create unbounded output and make accidental binary retrieval more likely.

### Azure CLI REST invocation with normalized pagination

Use `az devops invoke` for the comments endpoint with explicit organization, project route parameters, JSON output, a bounded page-size request, and supplied continuation parameters. Normalize the Azure list envelope and retain the returned continuation token. `--all` repeatedly requests continuation pages, deduplicating by comment ID; default behavior remains one bounded page. This works with the existing mockable command boundary rather than introducing an HTTP client or credential path.

### Attachment metadata from work-item relations

List attachments by reading the requested work item with relationship expansion and filtering `AttachedFile` relations. Normalize only relation attributes such as filename, content type, size, and creation date when present. This avoids an attachment-content request during listing. Malformed attached-file relations fail with a specific error instead of creating an ambiguous download target.

### Validated binary-only download path

Extend the runner with an optional binary operation implemented by `NodeAzRunner`. Download first re-reads the target work item, resolves the selected relation, verifies any supplied URL has the active Azure DevOps organization and, when encoded in the URL, project, then builds an attachment REST request from the validated attachment ID. It writes the returned bytes directly to a caller-selected file or an existing directory plus the safe listed filename. The structured result contains only identity, output path, size, and media type. Unsupported media types and filesystem failures become structured errors. Directly following a relation URL was rejected because it could cross the resolved target boundary.

## Risks / Trade-offs

- [Azure CLI REST resource route differences across extension versions] → Keep argv construction isolated and cover it with mocks; normalize request failures with upgrade guidance.
- [Relation attributes are incomplete] → Emit only available metadata and retain the stable validated identifier.
- [All-pages traversal can produce many comments] → Keep page mode as the default and bound individual comment text unless `--full` is explicit.
- [Attachment filename can be unsafe] → Sanitize it for directory targets and require an explicit file path or existing directory.

## Migration Plan

The new routes are additive, so existing read and mutation commands are unchanged. Build and test before release; rollback removes the new route surface without changing persisted Azure DevOps data.
