"""Run authored answer programs, checking the exact code printed in each chapter.

GO_TOOLCHAIN_EXE can select a Go installation. This script needs no third-party
Python packages and never writes learner records or installs dependencies.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def answer_blocks(chapter):
    text = (ROOT / f"docs/courses/{chapter.split('-')[0]}/{chapter}.md").read_text()
    return re.findall(
        r"### 参考答案[^\n]*\n(.*?)(?=\n#{1,3} |\n参考：|\Z)", text, re.S
    )


def main():
    checks = json.loads((ROOT / "docs/courses/answer-checks.json").read_text())
    count = 0
    for check in checks:
        if check["language"] not in {"go", "go-test"}:
            continue  # Browser answers have their own DOM checks.
        if "section" in check:
            text = (ROOT / f"docs/courses/{check['chapter'].split('-')[0]}/{check['chapter']}.md").read_text()
            block = re.search(r"## " + re.escape(check["section"]) + r"\n(.*?)(?=\n## |\Z)", text, re.S).group(1)
        else:
            block = answer_blocks(check["chapter"])[check["answer"]]
        code = re.findall(r"```go\n(.*?)\n```", block, re.S)
        names = check.get("files", ["main.go"])
        assert len(code) == len(names), check
        with tempfile.TemporaryDirectory(prefix="course-answer-") as name:
            directory = Path(name)
            (directory / "go.mod").write_text("module " + check.get("module", "example.com/answer") + "\n\ngo 1.22\n")
            for filename, content in {**check.get("support", {}), **dict(zip(names, code))}.items():
                file = directory / filename
                assert file.resolve().is_relative_to(directory.resolve()), check
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(content + ("\n" if filename.endswith(".go") else ""))
            command = ["test", "-count=1", "./..."] if check["language"] == "go-test" else ["run", "."]
            result = subprocess.run(
                [os.environ.get("GO_TOOLCHAIN_EXE", "go"), *command],
                cwd=directory, input=check.get("input", ""), capture_output=True,
                text=True, timeout=60,
            )
            assert result.returncode == 0, (check, result.stderr)
            if check["output"] is not None:
                assert result.stdout.strip() == check["output"].strip(), (
                    check, result.stdout, result.stderr
                )
            for expected in check.get("contains", []):
                assert expected in result.stdout, (check, result.stdout)
            if "mutation" in check:
                mutation = check["mutation"]
                file = directory / mutation["file"]
                original = file.read_text()
                assert mutation["from"] in original
                file.write_text(original.replace(mutation["from"], mutation["to"]))
                failure = subprocess.run([os.environ.get("GO_TOOLCHAIN_EXE", "go"), *command], cwd=directory, capture_output=True, timeout=60)
                assert failure.returncode != 0, (check, "intentional bug did not fail")
        count += 1
    print(f"PASS: {count} Go answer/example runs match their published output.")


if __name__ == "__main__":
    main()
