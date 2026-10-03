"""Model adapter boundary. Add 3DDFA-V3 / DECA here; nothing else in the service changes."""
from __future__ import annotations

import os
from typing import Protocol


class ReconstructionModel(Protocol):
    name: str
    device: str

    def warmup(self) -> None: ...

    def landmarks(self, image_bytes: bytes) -> list[dict]:
        """Return >=468 landmarks as {"x","y","z"} normalised to the image (z in image-width units).
        Raise ValueError when no face is found."""
        ...


def load_model() -> ReconstructionModel | None:
    """Return a loaded model, or None if none is installed.

    Wiring a real model (do this on a machine with the weights; it is intentionally not faked here):
      1. Install the chosen model (e.g. 3DDFA-V3) and its weights.
      2. Implement a class satisfying ReconstructionModel that maps the model's 3D vertices to the
         MediaPipe-478 topology indices used by lib/vision/landmarks.ts (MEDIAPIPE_INDEX), projects them
         with the model's estimated camera, and normalises to the input image.
      3. Select device with CUDA if available, else CPU, and return the instance here.
    """
    name = os.getenv("RECONSTRUCTION_MODEL", "").lower()
    if not name:
        return None
    raise NotImplementedError(f"No adapter is registered for RECONSTRUCTION_MODEL={name!r}. Implement it in reconstruction.py.")
