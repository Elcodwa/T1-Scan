"""
T1-Scan 3D reconstruction service.

Contract: POST /reconstruct (multipart "image": a face-aware crop) -> {"landmarks": [{x,y,z}*478+], "model": str}
x,y are normalised 0..1 over the uploaded image, z in units of image width — the same convention as the
MediaPipe provider, so the TypeScript engine treats both sources identically (consensus, not blending).

Privacy: images are decoded in memory, never written to disk, never logged. Only landmarks leave this service.
"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from reconstruction import ReconstructionModel, load_model

MAX_BYTES = int(os.getenv("MAX_IMAGE_BYTES", 8 * 1024 * 1024))
MAX_CONCURRENT = int(os.getenv("MAX_CONCURRENT", 2))
TIMEOUT_S = float(os.getenv("REQUEST_TIMEOUT_S", 20))
TOKEN = os.getenv("SERVICE_TOKEN")

log = logging.getLogger("t1scan.vision")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))  # request bodies are never logged

_model: ReconstructionModel | None = None
_gate = asyncio.Semaphore(MAX_CONCURRENT)  # memory protection: bounded concurrent inferences


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _model
    _model = load_model()  # loaded ONCE, then reused for every request (CPU fallback handled inside)
    if _model:
        await asyncio.to_thread(_model.warmup)
        log.info("model ready: %s on %s", _model.name, _model.device)
    else:
        log.warning("no reconstruction model installed; /reconstruct will return 503")
    yield


app = FastAPI(title="T1-Scan vision", lifespan=lifespan)


def _auth(authorization: str | None = Header(default=None)) -> None:
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": _model.name if _model else None, "device": _model.device if _model else None}


@app.post("/reconstruct", dependencies=[Depends(_auth)])
async def reconstruct(image: UploadFile = File(...)) -> JSONResponse:
    if _model is None:
        raise HTTPException(status_code=503, detail="reconstruction_model_not_installed")
    data = await image.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="image_too_large")
    async with _gate:
        try:
            landmarks = await asyncio.wait_for(asyncio.to_thread(_model.landmarks, data), TIMEOUT_S)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="timeout")
        except ValueError:
            raise HTTPException(status_code=422, detail="no_face")
        finally:
            del data  # drop the only reference to the pixels
    return JSONResponse({"landmarks": landmarks, "model": _model.name}, headers={"Cache-Control": "no-store"})
