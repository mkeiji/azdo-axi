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

Use `azdo-axi work-item list` for active Task items, with optional `--assignee`, `--iteration`, and `--area` filters. Use `azdo-axi work-item show <id>` for read-only details and relationships. Both routes emit concise TOON, include resolved scope, and accept `--full` when complete text or history is required. The create, update, links, and WIQL routes remain unavailable.
