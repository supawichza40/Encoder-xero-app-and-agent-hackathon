"""
Tier 1 unit tests: shared file_hash path-safety guard (MED-5).
"""

import pytest

from backend.validation import is_valid_hash


@pytest.mark.parametrize(
    "good_hash",
    ["a" * 64, "0123456789abcdef" * 4, "f" * 1],
)
def test_valid_hash_accepted(good_hash):
    assert is_valid_hash(good_hash) is True


@pytest.mark.parametrize(
    "bad_hash",
    [None, "", "../../etc/passwd", "not-hex!!", "a" * 65, "abc/def", "A" * 64],
)
def test_invalid_hash_rejected(bad_hash):
    assert is_valid_hash(bad_hash) is False
