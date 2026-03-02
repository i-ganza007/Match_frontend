// hooks/useMLModel.web.ts - Web fallback (no TFLite support)
export const preprocessImageForMobileNet = async (imageUri: string): Promise<Float32Array> => {
  console.warn('TFLite not supported on web - using mock preprocessing');
  return new Float32Array(224 * 224 * 3);
};

export const useMLModel = (modelRequire: any) => {
  console.warn('TFLite not supported on web - model disabled');
  
  return {
    state: 'loaded' as const,
    model: null,
    isReady: false,
    preparationError: 'Web platform - TFLite disabled',
    runInferenceWithRetry: async (imageUri: string) => {
      // Return mock data for UI testing
      const mockOutput = new Float32Array(14);
      mockOutput[0] = 0.9; // Mock high confidence for first class
      return mockOutput;
    },
  };
};
