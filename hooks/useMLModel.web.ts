// Web stub — TFLite inference is mobile-only
export const useMLModel = (_modelRequire: any, _options?: { preferAsync?: boolean }) => ({
  isReady: false,
  preparationError: 'TFLite not available on web',
  state: 'error' as const,
  modelShapes: '',
  loadStrategy: 'web-stub',
  bundleVersion: '',
  runInferenceWithRetry: async (_imageUri: string): Promise<{ embedding: Float32Array; debug: any }> => {
    throw new Error('TFLite inference not available on web');
  },
});
