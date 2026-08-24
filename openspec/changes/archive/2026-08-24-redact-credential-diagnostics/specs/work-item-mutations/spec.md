# work-item-mutations Specification Delta

## ADDED Requirements

### Requirement: Redact credential-shaped Azure diagnostics

When Azure CLI stderr is included in a normalized mutation error, the wrapper SHALL redact bearer authorization values, JSON access-token-style values, and credential-key assignments including underscored keys such as `client_secret`, before returning the diagnostic. The existing whitespace normalization and bounded diagnostic length SHALL remain in effect.

#### Scenario: Redact reviewed credential formats

- **WHEN** Azure CLI stderr contains `Authorization: Bearer <token>`, an `accessToken` or `access_token` JSON property, or a `client_secret=<value>`-style assignment
- **THEN** the normalized error SHALL retain safe diagnostic context while replacing each credential value with `[redacted]` and SHALL not contain the original values

#### Scenario: Preserve bounded diagnostics

- **WHEN** sanitized Azure CLI stderr exceeds the existing diagnostic limit
- **THEN** the normalized error SHALL continue to truncate the diagnostic to the existing bounded format
