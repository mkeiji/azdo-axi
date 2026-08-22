## Context

The package publishes only `dist` and declares its executable there. See proposal.md and the modified `cli-context-resolution` requirement.

## Goals / Non-Goals

**Goals:**

- Build distribution files as part of npm packaging.
- Exercise the resulting tarball through an isolated installation.

**Non-Goals:**

- Commit generated distribution files.
- Change CLI behavior or Azure DevOps integration.

## Decisions

Use npm's `prepack` lifecycle to build immediately before packing and publishing. The regression test removes `dist`, packs the project, installs the tarball into a temporary directory, and invokes the declared binary. This validates the consumer artifact rather than only the local build output.

## Risks / Trade-offs

- [Package test invokes npm and can be slower than unit tests] → Keep its scope to one local pack/install cycle and clean temporary files.
