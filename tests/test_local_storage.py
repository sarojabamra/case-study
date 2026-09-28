import pytest

from server import storage


def test_local_image_persists_and_can_be_removed(tmp_path, monkeypatch):
    monkeypatch.setenv('LOCAL_OBJECT_STORE_PATH', str(tmp_path))
    monkeypatch.setattr(storage, '_store', None)
    store = storage.get_object_store()
    assert isinstance(store, storage.LocalObjectStore)
    assert storage.get_object_store() is store
    key = 'tenants/1/products/2/image.png'
    store.put(key, b'image bytes', 'image/png')

    # A fresh storage instance must still be able to read the uploaded file.
    monkeypatch.setattr(storage, '_store', None)
    reopened = storage.get_object_store()
    assert reopened.get(key) == (b'image bytes', 'image/png')
    reopened.delete(key)
    assert not (tmp_path / key).exists()
    assert not (tmp_path / (key + '.meta')).exists()
    with pytest.raises(storage.ObjectNotFound):
        reopened.get(key)
