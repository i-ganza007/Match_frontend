// Fallback for TypeScript resolution.
// Metro bundler will use useMLModel.native.ts on native and useMLModel.web.ts on web.
// This file is only used by tsc for type-checking when no platform suffix matches.
export { useMLModel } from './useMLModel.native';
