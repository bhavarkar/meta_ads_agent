"""Server-Side Secret Encryption for Meta Tokens and Sensitive Credentials.
Implements requirement 4: Store Meta tokens only using a secure server-side secret storage mechanism.
Do not expose tokens through ordinary Supabase client queries.
"""

import base64
import os
import hashlib
from typing import Optional, Tuple
from cryptography.fernet import Fernet
from app.config import settings


def _get_encryption_key() -> bytes:
    """Derive a consistent 32-byte URL-safe base64 encryption key from server secrets."""
    raw_secret = (settings.SUPABASE_JWT_SECRET + settings.META_APP_SECRET).encode("utf-8")
    derived_32 = hashlib.sha256(raw_secret).digest()
    return base64.urlsafe_b64encode(derived_32)


def encrypt_secret(plain_text: str) -> bytes:
    """Encrypt a secret string (e.g. Meta access token) to encrypted ciphertext bytes."""
    if not plain_text:
        return b""
    fernet = Fernet(_get_encryption_key())
    return fernet.encrypt(plain_text.encode("utf-8"))


def decrypt_secret(cipher_bytes: bytes) -> str:
    """Decrypt ciphertext bytes back to plain text."""
    if not cipher_bytes:
        return ""
    fernet = Fernet(_get_encryption_key())
    return fernet.decrypt(cipher_bytes).decode("utf-8")


def mask_token(token: str) -> str:
    """Return a safe masked token string for client-side display without exposing secrets."""
    if not token or len(token) < 8:
        return "••••••••"
    prefix = token[:4]
    suffix = token[-4:]
    return f"{prefix}••••••••{suffix}"
