import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const HAS_LOGGED_IN_KEY = 'has_logged_in_before';

/**
 * Store auth token securely
 */


/**
 * Store auth token securely
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    console.log('✅ Token stored successfully');
  } catch (error) {
    console.error('❌ Error storing auth token:', error);
    throw error;
  }
};

/**
 * Get stored auth token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Store user data securely
 */
export const storeUserData = async (userData: any): Promise<void> => {
  try {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Get stored user data
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    const data = await SecureStore.getItemAsync(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Mark that user has successfully logged in before
 */
export const setHasLoggedIn = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync(HAS_LOGGED_IN_KEY, 'true');
  } catch (error) {
    console.error('Error setting login flag:', error);
  }
};

/**
 * Check if user has logged in before
 */
export const hasLoggedInBefore = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(HAS_LOGGED_IN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking login flag:', error);
    return false;
  }
};

/**
 * Enable biometric authentication
 */
export const enableBiometric = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
  } catch (error) {
    console.error('Error enabling biometric:', error);
    throw error;
  }
};

/**
 * Check if biometric is enabled
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking biometric status:', error);
    return false;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    // Keep HAS_LOGGED_IN_KEY to remember user has logged in before
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Clear all data including login history (for logout)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(HAS_LOGGED_IN_KEY);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};