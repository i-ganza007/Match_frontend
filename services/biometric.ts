import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * Check if device supports biometric authentication
 */
export const isBiometricSupported = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
};

/**
 * Check if biometric credentials are enrolled
 */
export const hasBiometricCredentials = async (): Promise<boolean> => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
};

/**
 * Get available biometric types
 */
export const getBiometricTypes = async (): Promise<LocalAuthentication.AuthenticationType[]> => {
  try {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch (error) {
    console.error('Error getting biometric types:', error);
    return [];
  }
};

/**
 * Get human-readable biometric type name
 */
export const getBiometricTypeName = async (): Promise<string> => {
  const types = await getBiometricTypes();
  
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris Recognition';
  }
  
  return 'Biometric';
};

/**
 * Authenticate using biometrics
 */
export const authenticateWithBiometric = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const biometricName = await getBiometricTypeName();
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate with ${biometricName}`,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'Biometric authentication failed',
    };
  }
};

/**
 * Check if biometric can be used (device supports it and has credentials)
 */
export const canUseBiometric = async (): Promise<boolean> => {
  const isSupported = await isBiometricSupported();
  const hasCredentials = await hasBiometricCredentials();
  return isSupported && hasCredentials;
};