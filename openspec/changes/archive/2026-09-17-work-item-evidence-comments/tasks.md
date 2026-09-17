## 1. Comment transport and metadata

- [x] 1.1 Normalize live and legacy comments envelopes, use `7.1-preview`, and preserve bounded pagination and deduplication; verify with focused comments tests
- [x] 1.2 Extract raster inline-image references from comment HTML into separate bounded metadata without fetching bytes; verify extraction and structured-output tests

## 2. Safe downloads

- [x] 2.1 Implement scoped inline-image selection and revalidation against freshly listed comments; verify URL and cross-scope tests
- [x] 2.2 Stage relation and inline downloads via `--out-file`, validate size/media/magic bytes/content, atomically publish no-clobber, and clean up; verify download regression tests

## 3. Validation

- [x] 3.1 Run typecheck and complete evidence regression suite, then validate and archive the OpenSpec change
