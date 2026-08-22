#!/usr/bin/env python3
"""Validate the repository's narrowly scoped PR Agent workflow contract."""

from pathlib import Path
import re
import sys


WORKFLOW = Path(".github/workflows/pr-agent.yml")
README = Path("README.md")
PIN = "f6af7d77554ff8d26adffded077e6461329e92fa"
SECRET_REF = "${{ secrets.OPENROUTER_API_KEY }}"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    require(WORKFLOW.is_file(), f"missing {WORKFLOW}")
    require(README.is_file(), f"missing {README}")
    workflow = WORKFLOW.read_text(encoding="utf-8")
    readme = README.read_text(encoding="utf-8")

    # Keep the workflow's top-level surface explicit; this also rejects extra
    # triggers or permission blocks added without updating this contract.
    top_level = re.findall(r"^([A-Za-z0-9_-]+):\s*$|^([A-Za-z0-9_-]+):\s+.+$", workflow, re.MULTILINE)
    top_level_keys = {first or second for first, second in top_level}
    require(top_level_keys == {"name", "on", "permissions", "jobs"}, "unexpected top-level workflow keys")
    require("name: PR Agent\n" in workflow, "workflow name must be PR Agent")
    require(
        re.search(r"^on:\n  pull_request:\n    types: \[opened, synchronize\]\n", workflow, re.MULTILINE),
        "workflow must trigger only on opened and synchronize pull requests",
    )
    require("pull_request_target:" not in workflow, "pull_request_target is not permitted")

    permissions = re.search(r"^permissions:\n((?:^  [^\n]+\n?)+)", workflow, re.MULTILINE)
    require(permissions is not None, "missing permissions block")
    permission_lines = [line.strip() for line in permissions.group(1).splitlines() if line.strip()]
    require(
        permission_lines == ["contents: read", "issues: write", "pull-requests: write"],
        "permissions must contain only contents: read, issues: write, and pull-requests: write",
    )

    require("  pr_agent_job:\n" in workflow, "missing pr_agent_job")
    require("    name: Run PR Agent\n" in workflow, "job display name must be Run PR Agent")
    require("    runs-on: ubuntu-latest\n" in workflow, "job must run on ubuntu-latest")
    require(f"uses: the-pr-agent/pr-agent@{PIN}\n" in workflow, "action must use the reviewed immutable revision")
    require("the-pr-agent/pr-agent@main" not in workflow, "mutable action revision is not permitted")
    require(workflow.count(SECRET_REF) == 2, "both OpenRouter key inputs must use OPENROUTER_API_KEY")
    require("GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n" in workflow, "GITHUB_TOKEN must use the GitHub token secret")
    for setting in (
        "config.model: openrouter/deepseek/deepseek-v4-flash-0731",
        "github_action_config.auto_review: true",
        "github_action_config.auto_describe: false",
        "github_action_config.auto_improve: false",
        'github_action_config.pr_actions: "[opened, synchronize]"',
    ):
        require(setting in workflow, f"missing required action setting: {setting}")
    require("OPENROUTER_API_KEY:" not in workflow, "secret value must not be assigned in the workflow")

    # Documentation verifies the name and gives maintainers a safe update path;
    # it deliberately contains no secret value.
    for phrase in ("OPENROUTER_API_KEY", "Actions secret", "review the upstream", "focused validation"):
        require(phrase in readme, f"README is missing setup guidance: {phrase}")
    require("gh secret set OPENROUTER_API_KEY" in readme, "README must document the exact secret setup command")
    print(f"Validated {WORKFLOW} and the OPENROUTER_API_KEY setup contract.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, OSError) as error:
        print(f"validation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
