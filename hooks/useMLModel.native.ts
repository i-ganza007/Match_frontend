// hooks/useMLModel.native.ts – MOCK MODE FOR TESTING
import { useState, useEffect } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';

export const preprocessImageForMobileNet = async (imageUri: string): Promise<Float32Array> => {
  console.log('Preprocessing image for MobileNetV2 (224x224)...');

  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 224, height: 224 } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
  );

  const buffer = await FileSystem.readAsStringAsync(manipulated.uri, { encoding: 'base64' });
  const data = Skia.Data.fromBase64(buffer);
  const skiaImage = Skia.Image.MakeImageFromEncoded(data);
  if (!skiaImage) throw new Error('Failed to decode image with Skia');

  const pixels = skiaImage.readPixels(0, 0, {
    width: 224,
    height: 224,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Opaque,
  }) as Uint8Array;

  if (!pixels || pixels.length !== 224 * 224 * 4) {
    throw new Error(`Invalid pixel data: expected ${224*224*4} bytes, got ${pixels?.length || 0}`);
  }

  const inputTensor = new Float32Array(224 * 224 * 3);
  let idx = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    inputTensor[idx++] = (pixels[i] / 127.5) - 1.0;
    inputTensor[idx++] = (pixels[i + 1] / 127.5) - 1.0;
    inputTensor[idx++] = (pixels[i + 2] / 127.5) - 1.0;
  }

  skiaImage.dispose();

  console.log(`✅ Preprocessing COMPLETE → Float32Array[${inputTensor.length}] ready`);
  return inputTensor;
};

export const useMLModel = (modelRequire: any) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsReady(true), 500);
  }, []);

  const runInferenceWithRetry = async (imageUri: string) => {
    console.log('🔄 MOCK MODE - Simulating inference');
    await new Promise(r => setTimeout(r, 1000));
    
    // Mock output: 512D for Siamese, 14D for breed classifier
    const mockOutput = new Float32Array(512);
    for (let i = 0; i < mockOutput.length; i++) {
      mockOutput[i] = Math.random() * 0.1;
    }
    return mockOutput;
  };

  return { isReady, runInferenceWithRetry };
};
