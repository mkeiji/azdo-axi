## 1. Command and payload foundation

- [x] 1.1 Extend invocation parsing with create/update common flags, aliases, repeatable custom fields, and local validation.
- [x] 1.2 Implement mutation payload builders and normalized mutation result helpers in the work-item module.

## 2. Mutation behavior

- [x] 2.1 Wire create and update routes through the resolved context and Azure CLI JSON boundary.
- [x] 2.2 Implement update pre-read comparison, safe no-op results, and normalized mutation failures.
- [x] 2.3 Ensure standard work-item types, task parent relationships, and custom fields are preserved end to end.

## 3. Agent-facing contract and tests

- [x] 3.1 Add focused tests for payloads, custom fields, no-ops, confirmation safety, validation, and failures.
- [x] 3.2 Update the installable skill and README with mutation commands and compact output contract.
- [x] 3.3 Build and validate the OpenSpec change, then archive it with the implementation.
