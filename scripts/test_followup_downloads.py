"""Download regressions: complete sources, stable bytes, no machine data."""
from pathlib import Path
import importlib.util
from tempfile import TemporaryDirectory
from io import BytesIO
import zipfile

spec = importlib.util.spec_from_file_location("packager", Path(__file__).with_name("build_followup_examples.py"))
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)

qa_root = Path(__file__).resolve().parents[1] / ".qa"
qa_root.mkdir(exist_ok=True)
with TemporaryDirectory(prefix="followup-download-", dir=qa_root) as temporary:
    packager.ROOT = Path(temporary).resolve()
    assert packager.ROOT.is_relative_to(qa_root.resolve()), "Test cleanup must stay in the workspace QA directory"
    folder = packager.ROOT / "exercises/web/followup-00"
    folder.mkdir(parents=True)
    (folder / "README.md").write_bytes(b"# Example\r\nRun locally.\r\n")
    (folder / "index.html").write_bytes(b"<h1>Local source</h1>\r\n")
    (folder / ".env.example").write_text("DATABASE_URL=replace-with-your-local-url\n", encoding="utf-8")
    (folder / "image.png").write_bytes(b"\x89PNG\r\n\x1a\n")
    (folder / ".env").write_text("private test placeholder", encoding="utf-8")
    for directory in ["node_modules", "dist", "coverage", "pgdata", ".git", "test-results"]:
        target = folder / directory
        target.mkdir()
        (target / "private.json").write_text('{"excluded":true}', encoding="utf-8")
    entry, archive = packager.package(0)
    with zipfile.ZipFile(BytesIO(archive)) as zipped:
        assert set(zipped.namelist()) == {
            "followup-00/README.md", "followup-00/index.html", "followup-00/.env.example", "followup-00/image.png"
        }
        assert b"\r\n" not in zipped.read("followup-00/README.md")
        assert zipped.read("followup-00/image.png") == b"\x89PNG\r\n\x1a\n"
    assert packager.package(0)[1] == archive, "Repeated build must have the same download hash"
    assert len(entry["files"]) == 4
    (folder / "index.html").write_text("<h1>Updated source</h1>\n", encoding="utf-8")
    assert packager.package(0)[0]["sha256"] != entry["sha256"], "Modified source invalidates the cached download"
    print("PASS: complete source/graphics downloads, ignored secrets/dependencies/data, normalized text and reproducible hashes.")
