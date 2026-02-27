// hooks/useMLModel.native.ts – model path works in dev and production (file:// copy)
import { useState, useEffect } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';
import { useTensorflowModel } from 'react-native-fast-tflite';

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
  const [modelPath, setModelPath] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [asset] = await Asset.loadAsync(modelRequire);
        const localUri = asset.localUri || asset.uri;
        
        if (localUri.startsWith('file://')) {
          setModelPath(localUri);
          setIsReady(true);
          console.log('✅ Model ready:', localUri);
        } else {
          const destPath = `${FileSystem.documentDirectory}model.tflite`;
          await FileSystem.copyAsync({ from: localUri, to: destPath });
          setModelPath(destPath);
          setIsReady(true);
          console.log('✅ Model copied to:', destPath);
        }
      } catch (e) {
        console.error('❌ Model load failed:', e);
      }
    })();
  }, [modelRequire]);

  const model = useTensorflowModel(modelPath ? { model: modelPath } : undefined);

  const runInferenceWithRetry = async (imageUri: string) => {
    if (!isReady || !model) throw new Error('Model not ready');
    
    const inputTensor = await preprocessImageForMobileNet(imageUri);
    const output = model.run([inputTensor]);
    return output[0] as Float32Array;
  };

  return { isReady: isReady && !!model, runInferenceWithRetry };
};
