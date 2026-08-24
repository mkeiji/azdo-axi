## 1. Context resolution and defaults parsing

- [x] 1.1 Determine whether all context fields are selected by explicit options or environment values before requesting CLI defaults, while retaining availability checks and precedence validation.
- [x] 1.2 Parse JSON defaults and the observed bounded INI-style `[defaults]` output without accepting malformed output or collapsing conflicting values.

## 2. Regression coverage and verification

- [x] 2.1 Add focused tests for JSON and INI defaults, complete explicit context without a defaults query, mixed explicit/default context, and malformed or ambiguous defaults.
- [x] 2.2 Run formatting, type checks, tests, and strict OpenSpec validation before archiving the change; run the required task pipeline after the committed archive is clean.
