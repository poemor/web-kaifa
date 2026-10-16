"""Package the small course projects from their editable source only."""
import sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = {
    "go-study-minutes": "exercises/go/study-minutes",
    "go-template-pages": "exercises/go/template-pages",
    "web-profile-card": "exercises/web/profile-card",
    "web-responsive-events": "exercises/web/responsive-events",
}
for name, directory in PROJECTS.items():
    base = ROOT / directory
    files = sorted(p for p in base.iterdir() if p.is_file() and p.suffix in {".go", ".mod", ".md", ".html", ".css"})
    target = ROOT / "assets/downloads" / f"{name}.zip"
    if "--check" in sys.argv:
        with ZipFile(target) as archive:
            expected = {base.name + "/" + p.name: p.read_bytes() for p in files}
            # These archives contain text sources only. A Windows-produced ZIP
            # may use CRLF while Git's checkout is LF on Linux.
            actual = {entry: archive.read(entry).replace(b"\r\n", b"\n") for entry in archive.namelist()}
            expected = {entry: content.replace(b"\r\n", b"\n") for entry, content in expected.items()}
            assert actual == expected, f"stale course download: {name}"
    else:
        with ZipFile(target, "w", compression=ZIP_DEFLATED) as archive:
            for file in files:
                archive.write(file, base.name + "/" + file.name)
print("PASS: course project archives match their source." if "--check" in sys.argv else f"Built {len(PROJECTS)} course project archives.")
