import { useState, useEffect, useRef } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { BUNDLE_VERSION } from '../constants/bundleVersion';

export { BUNDLE_VERSION };
console.log('[BUNDLE] ✅ useMLModel loaded — bundle: ' + BUNDLE_VERSION);

type TFModel = Awaited<ReturnType<typeof loadTensorflowModel>>;

export interface InferenceDebugInfo {
  inputMin: number;
  inputMax: number;
  inputMean: number;
  outputDim: number;
  outputNorm: number;
  outputSample: string;
  loadStrategy: string;
  inputFormat: string;
  modelInputShape: string;
  modelOutputShape: string;
}

const mean = [0.485, 0.456, 0.406];
const std  = [0.229, 0.224, 0.225];
const SIZE = 224;
const HW   = SIZE * SIZE;

// ─── Shared: resize + read raw RGBA pixels via Skia ──────────────────────────
const getPixels = async (imageUri: string): Promise<Uint8Array> => {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: SIZE, height: SIZE } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 },
  );
  await new Promise(r => setTimeout(r, 0));

  const skData  = await (Skia.Data as any).fromURI(manipulated.uri);
  const skImage = Skia.Image.MakeImageFromEncoded(skData);
  if (!skImage) throw new Error('Skia: could not decode image');

  const pixels = skImage.readPixels(0, 0, {
    width: SIZE, height: SIZE,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Opaque,
  }) as Uint8Array;
  skImage.dispose();

  if (!pixels || pixels.length !== HW * 4)
    throw new Error(`Pixel buffer invalid: expected ${HW * 4}, got ${pixels?.length ?? 0}`);

  await new Promise(r => setTimeout(r, 0));
  return pixels;
};

// ─── HWC layout: [R0,G0,B0, R1,G1,B1 …]  shape [1, H, W, C] ─────────────────
// Used when model.inputs[0].shape is [1, 224, 224, 3]
const toHWC = (pixels: Uint8Array): Float32Array => {
  const t = new Float32Array(3 * HW);
  let i = 0;
  for (let p = 0; p < HW; p++) {
    const s = p * 4;
    t[i++] = (pixels[s]     / 255 - mean[0]) / std[0];
    t[i++] = (pixels[s + 1] / 255 - mean[1]) / std[1];
    t[i++] = (pixels[s + 2] / 255 - mean[2]) / std[2];
  }
  return t;
};

// ─── CHW layout: [R_plane, G_plane, B_plane]  shape [1, C, H, W] ─────────────
// Used when model.inputs[0].shape is [1, 3, 224, 224]
const toCHW = (pixels: Uint8Array): Float32Array => {
  const t = new Float32Array(3 * HW);
  for (let p = 0; p < HW; p++) {
    const s = p * 4;
    t[0 * HW + p] = (pixels[s]     / 255 - mean[0]) / std[0];
    t[1 * HW + p] = (pixels[s + 1] / 255 - mean[1]) / std[1];
    t[2 * HW + p] = (pixels[s + 2] / 255 - mean[2]) / std[2];
  }
  return t;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useMLModel = (modelRequire: any, options?: { preferAsync?: boolean }) => {
  const preferAsync = options?.preferAsync ?? false;

  const [isReady, setIsReady]                   = useState(false);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const [loadStrategy, setLoadStrategy]         = useState<string>('');
  const [modelShapes, setModelShapes]           = useState<string>('');
  const [inputFormat, setInputFormat]           = useState<'NHWC' | 'NCHW' | 'unknown'>('unknown');

  const modelRef      = useRef<TFModel | null>(null);
  const isNCHWRef     = useRef<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('[MODEL] Loading TFLite...');
        const model = await loadTensorflowModel(modelRequire);

        const inShapes  = model.inputs.map(t  => `[${t.dataType}:${t.shape}]`).join(', ');
        const outShapes = model.outputs.map(t => `[${t.dataType}:${t.shape}]`).join(', ');
        console.log('[MODEL] Input  tensors:', inShapes);
        console.log('[MODEL] Output tensors:', outShapes);

        // Detect layout from first input tensor shape
        // NCHW → shape[1] = 3 (channels)   e.g. [1, 3, 224, 224]
        // NHWC → shape[3] = 3 (channels)   e.g. [1, 224, 224, 3]
        const shape   = model.inputs[0]?.shape ?? [];
        const isNchw  = shape.length === 4 && shape[1] === 3 && shape[2] === SIZE;
        const fmt     = isNchw ? 'NCHW' : 'NHWC';
        console.log(`[MODEL] Detected input format: ${fmt} — using ${fmt} preprocessing`);

        if (!cancelled) {
          modelRef.current  = model;
          isNCHWRef.current = isNchw;
          setLoadStrategy('loadTensorflowModel(require())');
          setModelShapes(`in:${inShapes} out:${outShapes}`);
          setInputFormat(fmt);
          setIsReady(true);
          console.log('✅ TFLite model ready');
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('❌ TFLite model load failed:', e.message);
          setPreparationError(e.message ?? 'Unknown load error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const runInferenceWithRetry = async (
    imageUri: string,
  ): Promise<{ embedding: Float32Array; debug: InferenceDebugInfo }> => {
    if (!modelRef.current) throw new Error('Model not ready');
    await new Promise(r => setTimeout(r, 0));

    const pixels     = await getPixels(imageUri);
    const inputTensor = isNCHWRef.current ? toCHW(pixels) : toHWC(pixels);
    const fmt        = isNCHWRef.current ? 'NCHW(CHW)' : 'NHWC(HWC)';
    console.log(`[INFER] Input format: ${fmt}, tensor length: ${inputTensor.length}`);

    let inputMin = Infinity, inputMax = -Infinity, inputSum = 0;
    for (let i = 0; i < inputTensor.length; i++) {
      if (inputTensor[i] < inputMin) inputMin = inputTensor[i];
      if (inputTensor[i] > inputMax) inputMax = inputTensor[i];
      inputSum += inputTensor[i];
    }
    const inputMean = inputSum / inputTensor.length;

    let outputs: any[];
    if (preferAsync) {
      console.log('[INFER] Running model.run() async...');
      outputs = await modelRef.current.run([inputTensor]);
    } else {
      console.log('[INFER] Running model.runSync()...');
      outputs = modelRef.current.runSync([inputTensor]);
    }

    const raw = outputs[0];
    console.log(`[INFER] Raw output type: ${raw?.constructor?.name}, length: ${raw?.length}`);

    // .slice() copies out of TFLite's shared output buffer so the first
    // embedding isn't overwritten when the second inference runs.
    const rawView =
      raw instanceof Float32Array
        ? raw
        : new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / Float32Array.BYTES_PER_ELEMENT);
    const embedding = rawView.slice();

    let normSq = 0, zeroCount = 0;
    for (let i = 0; i < embedding.length; i++) {
      normSq += embedding[i] * embedding[i];
      if (embedding[i] === 0) zeroCount++;
    }
    const norm   = Math.sqrt(normSq);
    const sample = Array.from(embedding.slice(0, 6)).map(v => v.toFixed(4)).join(', ');

    console.log(`[INFER] Embedding dim: ${embedding.length}`);
    console.log(`[INFER] Embedding L2-norm: ${norm.toFixed(6)}`);
    console.log(`[INFER] Embedding sample[0..5]: [${sample}]`);
    console.log(`[INFER] Zero-value count: ${zeroCount}/${embedding.length}`);

    if (norm < 0.001) console.warn('[INFER] ⚠️ Near-zero embedding');
    if (zeroCount === embedding.length)
      throw new Error('Model returned all-zero embedding — inference failed silently');

    const inShapes  = modelRef.current.inputs.map(t  => `${t.dataType}:[${t.shape}]`).join(', ');
    const outShapes = modelRef.current.outputs.map(t => `${t.dataType}:[${t.shape}]`).join(', ');

    return {
      embedding,
      debug: {
        inputMin, inputMax, inputMean,
        outputDim: embedding.length,
        outputNorm: norm,
        outputSample: sample,
        loadStrategy,
        inputFormat: fmt,
        modelInputShape: inShapes,
        modelOutputShape: outShapes,
      },
    };
  };

  return {
    isReady,
    runInferenceWithRetry,
    state: isReady ? 'loaded' as const : preparationError ? 'error' as const : 'loading' as const,
    preparationError,
    modelShapes,
    loadStrategy,
    inputFormat,
    bundleVersion: BUNDLE_VERSION,
  };
};
