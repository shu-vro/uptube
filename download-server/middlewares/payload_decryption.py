import base64
import json
import urllib.parse

import nacl.public
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

from config.env import ENV


def _pad_base64(s: str) -> str:
    return s + "=" * ((4 - len(s) % 4) % 4)


def _from_base64url(b64url: str) -> str:
    """Convert base64url to standard base64 with padding."""
    s = b64url.replace("-", "+").replace("_", "/")
    return _pad_base64(s)


def decrypt_hybrid(packed_b64: str) -> str:
    """Decrypt a NaCl box payload produced by the frontend encryptHybrid().

    Wire format (after base64url-decode):
        ephemeral_public_key  [0:32]   -- curve25519 public key
        nonce                 [32:56]  -- 24-byte random nonce
        ciphertext            [56:]    -- nacl.box ciphertext
    """
    packed_b64 = _from_base64url(str(packed_b64 or ""))
    packed = base64.b64decode(_pad_base64(packed_b64))

    if len(packed) < 56:
        raise ValueError("Ciphertext too short")

    eph_pk_bytes = packed[:32]
    nonce = packed[32:56]
    boxed = packed[56:]

    private_key_b64 = ENV.get("QUERY_PRIVATE_KEY")
    if not private_key_b64:
        raise ValueError("QUERY_PRIVATE_KEY is not configured")

    sk_bytes = base64.b64decode(_pad_base64(private_key_b64))
    if len(sk_bytes) != 32:
        raise ValueError("Invalid server secret key length")

    server_sk = nacl.public.PrivateKey(sk_bytes)
    eph_pk = nacl.public.PublicKey(eph_pk_bytes)
    box = nacl.public.Box(server_sk, eph_pk)

    plaintext = box.decrypt(boxed, nonce)
    return plaintext.decode()


class PayloadDecryptionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, allow_unencrypted: bool = True) -> None:
        super().__init__(app)
        self.allow_unencrypted = allow_unencrypted

    async def dispatch(self, request: Request, call_next):
        try:
            # Query params
            qs = request.scope.get("query_string", b"")
            params = dict(urllib.parse.parse_qsl(qs.decode("utf-8")))

            if not self.allow_unencrypted:
                encrypted_val = params.get("encrypted")
                params = {"encrypted": encrypted_val} if encrypted_val else {}

            encrypted_query = params.get("encrypted")
            if encrypted_query:
                try:
                    decrypted = decrypt_hybrid(encrypted_query)
                    parsed = json.loads(decrypted)
                    del params["encrypted"]
                    params.update(parsed)
                    request.scope["query_string"] = urllib.parse.urlencode(
                        params).encode("utf-8")
                    # Clear the cached QueryParams object if it was already built
                    if hasattr(request, "_query_params"):
                        del request._query_params
                    logger.debug(f"Decrypted query params: {params}")
                except Exception as e:
                    logger.error(f"Failed to decrypt query params: {e}")
                    return JSONResponse(
                        status_code=400,
                        content={"success": False,
                                 "message": "Invalid encrypted parameters"},
                    )

            # Request body
            body_bytes = await request.body()
            if body_bytes:
                try:
                    body_data = json.loads(body_bytes)

                    if not self.allow_unencrypted:
                        encrypted_body = body_data.get("encrypted")
                        body_data = {
                            "encrypted": encrypted_body} if encrypted_body else {}

                    encrypted_body = body_data.get("encrypted")
                    if encrypted_body:
                        try:
                            decrypted = decrypt_hybrid(encrypted_body)
                            parsed = json.loads(decrypted)
                            del body_data["encrypted"]
                            body_data.update(parsed)
                            # Override the cached body so downstream handlers see plaintext
                            request._body = json.dumps(
                                body_data).encode("utf-8")
                            logger.debug(
                                f"Decrypted request body keys: {list(body_data.keys())}")
                        except Exception as e:
                            logger.error(f"Failed to decrypt body: {e}")
                            return JSONResponse(
                                status_code=400,
                                content={"success": False,
                                         "message": "Invalid encrypted body"},
                            )
                except json.JSONDecodeError:
                    pass  # Non-JSON body — pass through unchanged

            return await call_next(request)

        except Exception as e:
            logger.error(f"Payload decryption middleware error: {e}")
            return await call_next(request)


def setup_payload_decryption_middleware(app: FastAPI, allow_unencrypted: bool = True) -> None:
    app.add_middleware(PayloadDecryptionMiddleware,
                       allow_unencrypted=allow_unencrypted)
