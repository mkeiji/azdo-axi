---
name: azdo-axi
description: Resolve and inspect the Azure DevOps Boards target used by azdo-axi.
---

# Azure DevOps Boards context

Use `azdo-axi context` before delegating Azure DevOps Boards work. Supply `--organization` and `--project` when the target is not already configured or when an explicit target is required.

```sh
azdo-axi context --organization https://dev.azure.com/example --project example-project
```

The CLI uses existing Azure CLI and Azure DevOps extension authentication. Do not provide, store, or print tokens. Commands are non-interactive and fail instead of selecting an ambiguous organization or project.

The work-item and WIQL routes currently validate and resolve context but do not perform Boards operations.
