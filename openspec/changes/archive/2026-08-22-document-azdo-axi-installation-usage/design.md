## Context

The published package exposes the `azdo-axi` binary from `package.json`, while a source checkout can build and run the same binary locally. The CLI preflights the Azure CLI and `azure-devops` extension, resolves organization and project context from flags, environment variables, or Azure DevOps CLI defaults, and delegates all Azure DevOps operations to `az`.

## Goals / Non-Goals

**Goals:**

- Make the README sufficient for a new user to install the package, prepare Azure CLI, choose a target, verify context, and run representative commands.
- Keep command syntax and option names aligned with `src/cli.ts` and `src/arguments.ts`.
- Describe the authentication and credential-storage boundary without implying that azdo-axi performs login or owns Azure CLI credentials.

**Non-Goals:**

- Changing the CLI implementation, output format, authentication flow, or package metadata.
- Documenting commands that are not exposed by the current CLI, including deletion.

## Decisions

- Document global npm installation as the primary path because `package.json` publishes the `azdo-axi` binary, and retain a source-checkout path for contributors.
- Present explicit `--organization` and `--project` flags first, then environment variables, then `az devops configure --defaults`, matching the resolver precedence.
- Use command examples that include explicit context where practical, while also showing configured defaults and environment-based context for repeat use.
- Group examples into context, read/query, and mutation workflows and call out aliases, repeatable custom fields, `--full`, no-op updates, and the absence of a delete command.

## Risks / Trade-offs

- Azure CLI authentication and configuration differ by account and environment → link to Azure CLI documentation and show the supported `az login` and `az devops login` entry points without claiming azdo-axi manages either credential.
- The CLI output is structured TOON and can change as fields evolve → describe the stable metadata and behavior rather than inventing a complete output transcript.
