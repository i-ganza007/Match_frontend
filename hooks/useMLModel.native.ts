// hooks/useMLModel.native.ts – model path works in dev and production (file:// copy)
import { useState, useEffect, useMemo } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Skia } from '@shopify/react-native-skia';
import { useTensorflowModel } from 'react-native-fast-tflite';

const MODEL_FILENAME = 'livestock_mobile_vnet_final.tflite';

export const preprocessImageForMobileNet = async (imageUri: string): Promise<Float32Array> => {
  console.log('Preprocessing image for MobileNetV2 (224x224)...');

  try {
    // 1. Resize to exact model input size
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 224, height: 224 } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
    );

    // 2. Load as base64 → Skia
    const buffer = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: 'base64',
    } as any);

    const data = Skia.Data.fromBase64(buffer);
    const skiaImage = Skia.Image.MakeImageFromEncoded(data);

    if (!skiaImage) throw new Error('Failed to decode image with Skia');

    // 3. Read RGBA pixels explicitly (Android-safe)
    const pixels = skiaImage.readPixels(0, 0, {
      width: 224,
      height: 224,
      colorType: 'rgba8888' as any,  // Explicit RGBA order
      alphaType: 'unpremul' as any,
    }) as Uint8Array;

    if (!pixels || pixels.length !== 224 * 224 * 4) {
      throw new Error(`Invalid pixel data: expected ${224*224*4} bytes, got ${pixels?.length || 0}`);
    }

    // 4. MobileNetV2 preprocessing: scale to [-1, 1] range
    // NHWC layout: batch=1, height=224, width=224, channels=3
    const inputTensor = new Float32Array(224 * 224 * 3);
    let idx = 0;

    for (let i = 0; i < pixels.length; i += 4) {  // Skip alpha channel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      // Scale from [0, 255] to [-1, 1]
      inputTensor[idx++] = (r / 127.5) - 1.0;
      inputTensor[idx++] = (g / 127.5) - 1.0;
      inputTensor[idx++] = (b / 127.5) - 1.0;
    }

    skiaImage.dispose();

    console.log(`✅ Preprocessing COMPLETE → Float32Array[${inputTensor.length}] ready`);
    return inputTensor;

  } catch (error) {
    console.error('Preprocessing failed:', error);
    throw error;
  }
};



export const useMLModel = (modelRequire: any) => {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [preparationError, setPreparationError] = useState<string | null>(null);

  // Stable file:// path – same in dev and production
  const destinationUri = FileSystem.documentDirectory + MODEL_FILENAME;

  // 1. Load asset and get its URI directly (skip file check to avoid crash)
  useEffect(() => {
    let cancelled = false;
    const prepareModel = async () => {
      try {
        console.log('📦 Starting model preparation...');
        
        if (modelRequire == null || modelRequire === undefined) {
          const err = 'Model asset required but require() returned null/undefined';
          console.error('❌', err);
          setPreparationError(err);
          setIsPreparing(false);
          return;
        }
        
        console.log('✅ Step 1: Model require is valid');
        
        console.log('📥 Step 2: Loading asset directly...');
        const asset = Asset.fromModule(modelRequire);
        console.log('✅ Asset created:', asset.name);
        
        console.log('⬇️ Step 3: Downloading asset...');
        await asset.downloadAsync();
        console.log('✅ Asset downloaded');

        const fromUri = asset.localUri && asset.localUri.startsWith('file://')
          ? asset.localUri
          : asset.uri;

        console.log('📍 Source URI:', fromUri);
        console.log('📍 URI type:', fromUri.startsWith('file://') ? 'FILE' : fromUri.startsWith('http') ? 'HTTP' : 'UNKNOWN');

        if (!fromUri) {
          const err = 'Asset has no URI after download';
          console.error('❌', err);
          setPreparationError(err);
          setIsPreparing(false);
          return;
        }

        if (cancelled) return;

        // Use the asset URI directly if it's already a file:// path
        if (fromUri.startsWith('file://')) {
          console.log('✅ Using asset file directly:', fromUri);
          setLocalUri(fromUri);
          setIsPreparing(false);
        } else {
          console.log('❌ Asset is not a file:// URI, cannot use:', fromUri);
          setPreparationError('Asset must be a file:// URI');
          setIsPreparing(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message ?? String(err);
          console.error('❌ Model preparation FAILED:', msg);
          console.error('❌ Error stack:', err?.stack);
          setPreparationError(msg);
          setIsPreparing(false);
        }
      }
    };

    prepareModel();
    return () => { cancelled = true; };
  }, [modelRequire, destinationUri]);

  // 2. Only initialize TFLite AFTER file is copied
  const modelSource = useMemo(
    () => localUri ? { url: localUri } : null,
    [localUri]
  );
  
  const tflite = useTensorflowModel(modelSource || { url: '' });

  // 3. Logging
  useEffect(() => {
    if (localUri && tflite.state === 'loaded') {
      console.log('✅ TFLite model loaded successfully from:', localUri);
    }
    if (tflite.state === 'error' && 'error' in tflite && tflite.error) {
      console.error('❌ TFLite load error:', tflite.error);
    }
  }, [tflite.state, localUri]);

  // 4. Inference with retry (MobileNetV2 uses Float32)
  const runInferenceWithRetry = async (imageUri: string, maxRetries = 3): Promise<Float32Array> => {
    if (!localUri) {
      throw new Error('Model file not prepared yet');
    }
    if (tflite.state !== 'loaded' || !tflite.model) {
      throw new Error('Model not ready yet (still preparing or failed)');
    }
    if (!imageUri) throw new Error('❌ No image provided');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const inputTensor = await preprocessImageForMobileNet(imageUri);
        const outputs = await tflite.model.run([inputTensor]);
        const logits = outputs[0] as Float32Array;

        console.log(`✅ Inference SUCCESS (attempt ${attempt})`);
        return logits;
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        if (attempt === maxRetries) throw error;
        await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }
    throw new Error('Inference failed after retries');
  };

  return {
    ...tflite,
    runInferenceWithRetry,
    isReady: !!localUri && tflite.state === 'loaded' && !!tflite.model && !isPreparing,
    preparationError,
  };
};