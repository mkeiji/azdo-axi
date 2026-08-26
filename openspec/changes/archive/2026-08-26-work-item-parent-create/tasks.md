## 1. Parent relation creation

- [x] 1.1 Add the Azure CLI hierarchy relation argv builder and create orchestration that runs it only when `--parent` is supplied.
- [x] 1.2 Verify the created item through expanded relations or `System.Parent`, reject unverified results, and preserve normalized errors and output.

## 2. Regression coverage

- [x] 2.1 Update create payload coverage and add offline tests for relation mutation, post-create verification, and the no-parent path.
- [x] 2.2 Add failure coverage proving relation and verification failures never report successful creation.

## 3. Validation and delivery

- [x] 3.1 Update the user-facing create contract and run proposal validation plus the applicable repository checks.
- [x] 3.2 Review the complete diff, create the required problem-fit contract and PR body, run the mandated pipeline, archive the OpenSpec change, and commit the implementation.
