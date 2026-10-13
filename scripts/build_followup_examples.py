"""Package editable lesson sources, never dependencies, secrets or build output."""
from pathlib import Path
from io import BytesIO
import argparse
import hashlib
import json
import os
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "downloads"
EXCLUDED_DIRS = {"node_modules", "dist", "build", ".git", ".qa", ".cache", "coverage", "pgdata", "postgres-data", "test-results", "playwright-report", "__pycache__"}
SOURCE_SUFFIXES = {".html", ".css", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".json", ".md", ".svg", ".sql", ".go", ".mod", ".sum", ".yaml", ".yml", ".txt", ".py", ".sh", ".bash", ".ps1", ".cmd", ".bat", ".conf", ".toml", ".ini", ".lock"}
SOURCE_NAMES = {"Dockerfile", "Caddyfile", "Makefile", ".gitignore", ".dockerignore", ".env.example", ".nvmrc", ".prettierrc", ".eslintrc"}
BINARY_ASSETS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2"}
GENERATED_ASSETS = {"public/banner-original.svg", "public/banner-optimized.svg"}


def package(index):
    code = f"{index:02}"
    relative = f"exercises/web/followup-{code}"
    directory = (ROOT / relative).resolve()
    if not directory.is_relative_to(ROOT) or not (directory / "README.md").is_file():
        raise ValueError(f"Missing runnable example README: {relative}")
    buffer = BytesIO()
    files = []
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        sources = []
        for current, folders, names in os.walk(directory, followlinks=False):
            folders[:] = sorted(name for name in folders if name not in EXCLUDED_DIRS and not (Path(current) / name).is_symlink())
            sources.extend(Path(current) / name for name in names)
        for source in sorted(sources):
            name = source.relative_to(directory)
            if any(part in EXCLUDED_DIRS for part in name.parts):
                continue
            if name.as_posix() in GENERATED_ASSETS:
                continue
            if source.is_symlink() or not source.resolve().is_relative_to(directory):
                raise ValueError(f"Example source escapes its own directory: {source}")
            if source.name.startswith(".env") and source.name != ".env.example":
                continue
            if source.suffix not in SOURCE_SUFFIXES | BINARY_ASSETS and source.name not in SOURCE_NAMES:
                continue
            content = source.read_bytes() if source.suffix in BINARY_ASSETS else source.read_text(encoding="utf-8-sig").replace("\r\n", "\n").encode("utf-8")
            info = zipfile.ZipInfo(f"followup-{code}/{name.as_posix()}", date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, content)
            files.append({"name": name.as_posix(), "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
    if len(files) < 2:
        raise ValueError(f"Example contains no complete source files: {relative}")
    data = buffer.getvalue()
    download = f"assets/downloads/web-followup-{code}.zip"
    return {"id": f"web-{code}", "examplePath": relative, "download": download, "sha256": hashlib.sha256(data).hexdigest(), "files": files}, data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    entries = []
    if not args.check:
        OUTPUT.mkdir(parents=True, exist_ok=True)
    for index in range(12):
        entry, data = package(index)
        destination = ROOT / entry["download"]
        if args.check:
            if not destination.is_file() or destination.read_bytes() != data:
                raise ValueError(f"Source download is stale: {entry['download']}")
        else:
            destination.write_bytes(data)
        entries.append(entry)
    manifest = json.dumps({"version": 1, "examples": entries}, ensure_ascii=False, indent=2) + "\n"
    target = OUTPUT / "followup-manifest.json"
    if args.check:
        if not target.is_file() or target.read_text(encoding="utf-8") != manifest:
            raise ValueError("Followup source manifest is stale")
        print("PASS: all 12 source downloads match editable files; dependencies and build output excluded.")
    else:
        target.write_text(manifest, encoding="utf-8", newline="\n")
        print(f"Built 12 source downloads with {sum(len(item['files']) for item in entries)} editable files.")


if __name__ == "__main__":
    main()
