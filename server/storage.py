import os
from pathlib import Path
from typing import Protocol

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class StorageError(Exception):
    """Object storage could not complete the request."""


class ObjectNotFound(Exception):
    """The image does not exist in storage."""


class ObjectStore(Protocol):
    def put(self, key: str, body: bytes, content_type: str) -> None:
        ...

    def get(self, key: str) -> tuple[bytes, str]:
        ...

    def delete(self, key: str) -> None:
        ...


def _check_key(key: str) -> None:
    parts = key.split("/")
    if (
        not key
        or key.startswith("/")
        or "\\" in key
        or any(part in {"", ".", ".."} for part in parts)
    ):
        raise StorageError("invalid object key")


def _check_content_type(content_type: str) -> None:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise StorageError("invalid content type")


class MemoryObjectStore:
    def __init__(self) -> None:
        self.objects: dict[str, tuple[bytes, str]] = {}

    def put(self, key: str, body: bytes, content_type: str) -> None:
        _check_key(key)
        _check_content_type(content_type)
        self.objects[key] = (body, content_type)

    def get(self, key: str) -> tuple[bytes, str]:
        _check_key(key)
        item = self.objects.get(key)
        if item is None:
            raise ObjectNotFound(key)
        return item

    def delete(self, key: str) -> None:
        _check_key(key)
        self.objects.pop(key, None)


_EXT_CONTENT_TYPE = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}


class LocalObjectStore:
    def __init__(self, root: Path) -> None:
        self._root = root.resolve()
        self._root.mkdir(parents=True, exist_ok=True)

    def _path_for(self, key: str) -> Path:
        _check_key(key)
        path = (self._root / key).resolve()
        root = str(self._root)
        if path != self._root and not str(path).startswith(f"{root}/"):
            raise StorageError("invalid object key")
        return path

    def put(self, key: str, body: bytes, content_type: str) -> None:
        _check_content_type(content_type)
        path = self._path_for(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
        path.with_suffix(path.suffix + ".meta").write_text(content_type, encoding="utf-8")

    def get(self, key: str) -> tuple[bytes, str]:
        path = self._path_for(key)
        if not path.is_file():
            raise ObjectNotFound(key)
        meta = path.with_suffix(path.suffix + ".meta")
        if meta.is_file():
            content_type = meta.read_text(encoding="utf-8").strip()
        else:
            content_type = _EXT_CONTENT_TYPE.get(path.suffix.lstrip(".").lower(), "application/octet-stream")
        return path.read_bytes(), content_type

    def delete(self, key: str) -> None:
        path = self._path_for(key)
        meta = path.with_suffix(path.suffix + ".meta")
        path.unlink(missing_ok=True)
        meta.unlink(missing_ok=True)


def default_local_store_root() -> Path:
    configured = os.getenv("LOCAL_OBJECT_STORE_PATH")
    if configured:
        return Path(configured).expanduser()
    return Path(__file__).resolve().parents[1] / "product-images-data"


_store: ObjectStore | None = None


def get_object_store() -> ObjectStore:
    global _store
    if _store is not None:
        return _store
    _store = LocalObjectStore(default_local_store_root())
    return _store
