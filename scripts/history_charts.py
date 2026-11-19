#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Render the README charts from checked-in CI measurements and Git history."""

import csv
import json
from pathlib import Path
import subprocess

import matplotlib

matplotlib.use("Agg")
from matplotlib import pyplot as plt
from matplotlib.ticker import PercentFormatter

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"
PALETTE = ["#6241b5", "#235dae", "#138668", "#9b5998", "#c66b1a"]


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True)


def style_axes(ax) -> None:
    ax.set_axisbelow(True)
    ax.grid(axis="y", color="#e4deed")
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["left", "bottom"]].set_color("#c1b3d1")


def coverage_chart(samples) -> None:
    fig, ax = plt.subplots(figsize=(9.2, 3.7), layout="constrained")
    versions = [sample["version"] for sample in samples]
    series = (
        ("line_coverage", "Application lines", PALETTE[0]),
        ("mutation_score", "All mutants", PALETTE[1]),
        ("covered_mutation_score", "Mutants reached by tests", PALETTE[2]),
    )
    for key, label, color in series:
        ax.plot(
            versions, [float(sample[key]) for sample in samples],
            color=color, label=label, marker="o", linewidth=2,
        )
    ax.set(
        title="Boldemort · Coverage and mutation history",
        xlabel="Version with a recorded CI measurement",
        ylim=(65, 102),
    )
    ax.yaxis.set_major_formatter(PercentFormatter())
    ax.legend(loc="center left", frameon=False)
    style_axes(ax)
    fig.savefig(MEDIA / "coverage-history.png", dpi=155)
    plt.close(fig)


def code_group(path: str) -> str | None:
    if path in {"src/document.ts", "src/markdown.ts", "src/unicode.ts"}:
        return "Editor and conversion"
    if path == "src/analysis.ts":
        return "Writing analysis"
    if path.startswith(("src/", "public/")) or path == "index.html":
        return "Interface and styles"
    if path.endswith(".test.ts") and path.startswith("tests/"):
        return "Unit tests"
    if path.endswith(".spec.ts") and path.startswith("tests/"):
        return "Browser tests"
    return None


def code_chart(end_revision: str) -> None:
    groups = (
        "Editor and conversion", "Writing analysis", "Interface and styles",
        "Unit tests", "Browser tests",
    )
    counts = {group: [] for group in groups}
    versions = []
    for revision in git(
        "rev-list", "--first-parent", "--reverse", end_revision
    ).splitlines():
        files = git("ls-tree", "-r", "--name-only", revision).splitlines()
        if "package.json" not in files:
            continue
        versions.append(json.loads(git("show", f"{revision}:package.json"))["version"])
        totals = dict.fromkeys(groups, 0)
        for path in files:
            if group := code_group(path):
                totals[group] += len(git("show", f"{revision}:{path}").splitlines())
        for group in groups:
            counts[group].append(totals[group])

    fig, ax = plt.subplots(figsize=(9.2, 4.1), layout="constrained")
    positions = range(len(versions))
    ax.stackplot(positions, *counts.values(), labels=groups, colors=PALETTE, alpha=0.94)
    ax.set(
        title="Boldemort · Where the code lives",
        xlabel="Version",
        ylabel="Tracked lines",
        xlim=(0, len(versions) - 1),
    )
    ticks = range(0, len(versions), max(1, (len(versions) + 8) // 9))
    ticks = sorted(set(ticks) | {len(versions) - 1})
    ax.set_xticks(ticks, [versions[index] for index in ticks])
    ax.legend(loc="upper left", frameon=False, ncols=2)
    style_axes(ax)
    fig.savefig(MEDIA / "code-history.png", dpi=155)
    plt.close(fig)


def main() -> None:
    with (ROOT / "docs/coverage-history.csv").open(newline="") as data:
        samples = list(csv.DictReader(data))
    coverage_chart(samples)
    code_chart(samples[-1]["revision"])


if __name__ == "__main__":
    main()
