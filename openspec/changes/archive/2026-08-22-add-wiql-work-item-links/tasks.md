## 1. Query and relationship implementation

- [x] 1.1 Add structured raw-WIQL query execution with scoped count, empty-result metadata, custom field preservation, and normalized errors.
- [x] 1.2 Add work-item link retrieval and mapping for parent, child, related, and unknown relation types, including explicit empty counts and custom target data.
- [x] 1.3 Route query and links through the CLI while preserving context resolution, preflight ordering, and TOON boundary output.

## 2. Validation and compatibility

- [x] 2.1 Verify argument parsing rejects unknown query/link flags and accepts only the documented options before Azure CLI invocation.
- [x] 2.2 Update user-facing command documentation and extend the read-only specification for the new routes and custom data behavior.

## 3. Tests and delivery

- [x] 3.1 Add tests for query handling, raw WIQL argv, empty results, custom fields, link mapping, and failure normalization.
- [x] 3.2 Run build and test validation, inspect the complete diff, and archive the OpenSpec change.
