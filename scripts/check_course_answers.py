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
        if check["language"] != "go":
            continue  # Browser answers have their own DOM checks.
        block = answer_blocks(check["chapter"])[check["answer"]]
        code = re.findall(r"```go\n(.*?)\n```", block, re.S)
        assert len(code) == 1, check
        with tempfile.TemporaryDirectory(prefix="course-answer-") as name:
            directory = Path(name)
            (directory / "go.mod").write_text("module example.com/answer\n\ngo 1.22\n")
            (directory / "main.go").write_text(code[0] + "\n")
            result = subprocess.run(
                [os.environ.get("GO_TOOLCHAIN_EXE", "go"), "run", "."],
                cwd=directory, input=check.get("input", ""), capture_output=True,
                text=True, timeout=60,
            )
            assert result.returncode == 0, (check, result.stderr)
            if check["output"] is not None:
                assert result.stdout.strip() == check["output"].strip(), (
                    check, result.stdout, result.stderr
                )
        count += 1
    print(f"PASS: {count} Go answer programs match their published output.")


if __name__ == "__main__":
    main()
