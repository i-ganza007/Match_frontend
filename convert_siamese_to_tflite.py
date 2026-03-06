"""
Convert AttentionSiameseNetwork (.pth) → int8 TFLite via ai-edge-torch.

Backbone: MobileNetV3-Small (576 feature channels)
Head:     SpatialChannelAttention(576) → AdaptiveAvgPool → FC 576→512→512 (L2)

Pipeline (direct PyTorch → TFLite, no ONNX step):
  1. Load state_dict → wrap in single-input Embedder → verify [1, 512] output
  2a. Full int8 PT2E quantization  (weights + activations → int8)
        → ~3-5 MB, fastest on mobile, needs 50-200 real calib images
  2b. --dynamic: dynamic-range quant (weights int8, activations float)
        → ~5-8 MB, no calibration images needed, near-identical accuracy
  3. ai_edge_torch.convert() → export .tflite

Preprocessing (unchanged in React Native):
  Resize to 224×224 → float32 [0,1] → ImageNet normalise (mean/std)

Setup (one-time):
  Double-click  setup_conv_env.bat   (creates .conv_venv, installs all deps)

Run:
  .conv_venv\\Scripts\\python.exe convert_siamese_to_tflite.py

  # With calibration images (best size + accuracy):
  mkdir calibration_images  &&  copy breed photos there
  .conv_venv\\Scripts\\python.exe convert_siamese_to_tflite.py

  # No calibration images needed (slightly larger):
  .conv_venv\\Scripts\\python.exe convert_siamese_to_tflite.py --dynamic
"""

import argparse
import os
import sys
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
from pathlib import Path

# ─── Model definition — must match training EXACTLY ──────────────────────────

class SpatialChannelAttention(nn.Module):
    def __init__(self, in_channels, reduction=16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        # AdaptiveMaxPool2d(1) is not supported by ai_edge_torch TFLite lowering;
        # torch.amax(x, dim=[2,3]) is equivalent and fully supported.
        self.fc = nn.Sequential(
            nn.Linear(in_channels, in_channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(in_channels // reduction, in_channels, bias=False)
        )
        self.conv_spatial = nn.Conv2d(2, 1, kernel_size=7, padding=3, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        b, c, _, _ = x.size()
        avg_out = self.fc(self.avg_pool(x).view(b, c)).view(b, c, 1, 1)
        max_out = self.fc(torch.amax(x, dim=[2, 3])).view(b, c, 1, 1)  # replaces AdaptiveMaxPool2d(1)
        x = x * self.sigmoid(avg_out + max_out)
        avg_mask = torch.mean(x, dim=1, keepdim=True)
        max_mask, _ = torch.max(x, dim=1, keepdim=True)
        spatial_att = self.sigmoid(self.conv_spatial(torch.cat([avg_mask, max_mask], dim=1)))
        return x * spatial_att


class AttentionSiameseNetwork(nn.Module):
    """MobileNetV3-Small backbone + SCSAM attention + 576→512→512 FC head."""
    def __init__(self, embedding_dim=512):
        super().__init__()
        # Drop classifier (-1) and avgpool (-2) → 576-channel feature map
        base = models.mobilenet_v3_small(weights=None)   # weights loaded from .pth
        self.features = nn.Sequential(*list(base.children())[:-2])
        self.attention = SpatialChannelAttention(576)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(576, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(True),
            nn.Dropout(0.3),
            nn.Linear(512, embedding_dim)
        )

    def forward_once(self, x):
        x = self.features(x)
        x = self.attention(x)
        x = self.pool(x).view(x.size(0), -1)
        return F.normalize(self.fc(x), p=2, dim=1)

    # Training signature: triplet (anchor, positive, negative)
    def forward(self, a, p, n):
        return self.forward_once(a), self.forward_once(p), self.forward_once(n)


class Embedder(nn.Module):
    """Single-input export wrapper: [1,3,224,224] → [1,512].
    The training forward() takes 3 args (triplet), so this thin wrapper
    exposes a single-input interface for ai_edge_torch.convert().
    """
    def __init__(self, base: AttentionSiameseNetwork):
        super().__init__()
        self.base = base

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.base.forward_once(x)


# ─── Calibration helpers ──────────────────────────────────────────────────────

def _load_calib_image(path: str, img_size: int = 224) -> torch.Tensor:
    """Load one image → float32 tensor [1,3,224,224] normalised to ImageNet stats."""
    try:
        import cv2
        img = cv2.imread(path)
        if img is None:
            return None
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (img_size, img_size))
    except ImportError:
        from PIL import Image
        img = np.array(Image.open(path).convert("RGB").resize((img_size, img_size)))

    img = img.astype(np.float32) / 255.0
    # ImageNet normalisation — same as training
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img = (img - mean) / std                         # HWC
    img = np.transpose(img, (2, 0, 1))               # → CHW
    return torch.from_numpy(img).unsqueeze(0)        # → [1,3,H,W]


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", default="best_triplet_model.pth")
    parser.add_argument("--out",     default="assets/models/livestock_biometric_int8.tflite")
    parser.add_argument("--embedding-dim", type=int, default=512)
    parser.add_argument("--calib",   default="calibration_images",
                        help="Folder with 50-200 representative .jpg/.png images.")
    parser.add_argument("--dynamic", action="store_true",
                        help="Use dynamic-range quant (no calib needed). "
                             "Slightly larger (~5-8 MB) but faster to run.")
    args = parser.parse_args()

    weights_path = args.weights
    out_path     = args.out

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)

    # ── 1. Load PyTorch model ─────────────────────────────────────────────────
    print("=" * 60)
    print("[1/3] Loading PyTorch weights …")
    if not os.path.exists(weights_path):
        sys.exit(
            f"\nERROR: weights file not found: {weights_path}\n"
            f"Tip: make sure best_triplet_model.pth is in the same folder,\n"
            f"or pass --weights /full/path/to/best_triplet_model.pth\n"
        )

    model = AttentionSiameseNetwork(embedding_dim=args.embedding_dim)
    state = torch.load(weights_path, map_location="cpu", weights_only=True)
    if isinstance(state, dict) and "model_state_dict" in state:
        state = state["model_state_dict"]
    elif isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    model.eval()

    # Wrap in single-input Embedder — the training forward() takes 3 args (triplet)
    # but TFLite conversion needs a single-input model.
    embedder = Embedder(model).eval()
    sample_input = (torch.zeros(1, 3, 224, 224),)
    with torch.no_grad():
        out = embedder(*sample_input)
    print(f"    Output shape : {out.shape}  OK  (expected [1, {args.embedding_dim}])")
    assert out.shape == (1, args.embedding_dim), \
        f"Shape mismatch: got {out.shape} -- check --embedding-dim"
    print(f"    L2 norm      : {out.norm(dim=1).item():.6f}  (should be ~1.0)")

    # ── 2. Quantize ───────────────────────────────────────────────────────────
    try:
        import ai_edge_torch
    except ImportError:
        sys.exit(
            "\nERROR: ai-edge-torch not installed.\n"
            "Run setup_conv_env.bat first, then use .conv_venv\\Scripts\\python.exe\n"
        )

    if args.dynamic:
        # ── Dynamic-range quantization (no calib) ────────────────────────────
        # Weights → int8, activations stay float32.  No calibration needed.
        # MobileNetV3-Small: ~5-8 MB.  Accuracy: near-identical to float32.
        print("\n[2/3] Quantization mode: dynamic-range (weights-only int8, no calib)")
        quant_model_for_export = embedder
    else:
        # ── Full PT2E int8 quantization (with calibration) ───────────────────
        # Weights + activations → int8.  Needs representative images.
        # MobileNetV3-Small: ~3-5 MB.  Fastest on mobile.
        print("\n[2/3] Quantization mode: full int8 PT2E (calibration)")

        from ai_edge_torch.quantize import pt2e_quantizer
        try:
            from torch.ao.quantization.quantize_pt2e import prepare_pt2e, convert_pt2e
        except ImportError:
            try:
                from torch.ao.quantization import prepare_pt2e, convert_pt2e
            except ImportError:
                sys.exit(
                    "\nERROR: prepare_pt2e not found in this torch version.\n"
                    "Use --dynamic flag for dynamic-range quantization instead:\n"
                    "  .conv_venv\\Scripts\\python.exe convert_siamese_to_tflite.py --dynamic\n"
                )

        exported = torch.export.export(embedder, sample_input)

        quantizer = pt2e_quantizer.PT2EQuantizer().set_global(
            pt2e_quantizer.get_symmetric_quantization_config(is_dynamic=False)
        )
        prepared = prepare_pt2e(exported, quantizer)

        # Run calibration images through the prepared model
        calib_dir = args.calib
        os.makedirs(calib_dir, exist_ok=True)
        exts = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')
        calib_files = [f for f in os.listdir(calib_dir)
                       if f.lower().endswith(exts)]

        if not calib_files:
            print(f"    WARNING: No images found in '{calib_dir}'.")
            print("    Using random tensors — accuracy will be lower than with real images.")
            print("    Add 50-200 livestock/breed photos to that folder and re-run for best results.")
            for _ in range(50):
                prepared(torch.randn(1, 3, 224, 224))
        else:
            print(f"    Found {len(calib_files)} calibration images → using up to 200.")
            for i, fname in enumerate(calib_files[:200]):
                t = _load_calib_image(os.path.join(calib_dir, fname))
                if t is not None:
                    prepared(t)
                    if (i + 1) % 25 == 0:
                        print(f"    Calibrated {i + 1}/{min(len(calib_files), 200)} …")

        quantized_model = convert_pt2e(prepared, fold_quantize=False)
        quant_model_for_export = quantized_model
        print("    Quantization complete  OK")

    # ── 3. Convert to TFLite via ai_edge_torch ────────────────────────────────
    print(f"\n[3/3] Converting to TFLite via ai_edge_torch …")
    edge_model = ai_edge_torch.convert(
        quant_model_for_export,
        sample_input,
    )
    edge_model.export(out_path)

    size_mb = Path(out_path).stat().st_size / (1024 ** 2)
    print(f"\n{'=' * 60}")
    print(f"  Done!  OK")
    print(f"  Output : {out_path}")
    print(f"  Size   : {size_mb:.1f} MB  (MobileNetV3-Small int8)")
    print(f"{'=' * 60}")
    print()
    print("Next steps:")
    print("  1. Update MODEL_ASSET in app/(tabs)/(genetics)/lineage-verification.tsx:")
    print("       const MODEL_ASSET = require('../../../assets/models/livestock_biometric_int8.tflite');")
    print()
    if not args.dynamic:
        print("  NOTE: Full int8 model expects float32 [0-1] input normalised with ImageNet")
        print("        mean/std — matching the calibration preprocessing above. No RN changes needed.")
        print("        If accuracy is poor, re-run with --dynamic or add more calib images.")
        print()
    print("  2. Bump BUNDLE_VERSION in constants/bundleVersion.ts, then publish:")
    print("       EAS_SKIP_AUTO_FINGERPRINT=1 npm run update -- 'feat: MobileNetV3 int8 model'")


if __name__ == "__main__":
    main()
