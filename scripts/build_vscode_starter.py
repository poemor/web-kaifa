"""Build a reproducible source-only VS Code Go starter download."""
import io
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXAMPLE = ROOT / "exercises/go/vscode-first-program"
CONFIG = ROOT / "docs/tutorials/configs/go"
TARGET = ROOT / "assets/downloads/vscode-go-starter.zip"
buffer = io.BytesIO()
with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    files = [(p, p.name) for p in sorted(EXAMPLE.iterdir(), key=lambda p: p.name.casefold()) if p.name in {"README.md", "main.go", "go.mod"}]
    files += [(p, ".vscode/" + p.name) for p in sorted(CONFIG.glob("*.json"))]
    for source, name in files:
        entry = zipfile.ZipInfo("vscode-first-program/" + name, (1980, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, source.read_text(encoding="utf-8-sig").replace("\r\n", "\n").encode())
payload = buffer.getvalue()
if "--check" in sys.argv:
    assert TARGET.exists() and TARGET.read_bytes() == payload, "Rebuild with python scripts/build_vscode_starter.py"
    print("PASS: VS Code Go starter has current source and four workspace configurations.")
else:
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_bytes(payload)
    print("Built", TARGET.relative_to(ROOT))
