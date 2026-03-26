import api from './api';
import {
  storeAuthToken,
  storeUserData,
  getUserData,
  setHasLoggedIn,
  hasLoggedInBefore,
  enableBiometric,
  isBiometricEnabled,
  clearAuthData,
  clearAllData,
} from './secureStorage';
import { getCurrentLocation } from './location';
import { authenticateWithBiometric, canUseBiometric } from './biometric';

export interface SignupData {
  name: string;
  sex: 'MALE' | 'FEMALE';
  password: string;
  phone_number: string;
  email?: string;
  district: string;
  sector: string;
  village: string;
  cell: string;
  lastActive?: string; // ISO timestamp
}

export interface LoginData {
  email: string; // Your backend uses email for login
  password: string;
}

export interface User {
  userId: string;
  name: string;
  phone_number: string;
  email?: string;
  profile_url?: string;
  district: string;
  sector: string;
  village: string;
  cell: string;
  sex: 'MALE' | 'FEMALE';
  latitude?: number;
  longitude?: number;
}

/**
 * Check if user is online
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    // Use a lightweight public-ish endpoint. A 401 still means the server is up.
    const response = await api.get('/auth/loggedIn', { timeout: 5000 });
    return response.status === 200;
  } catch (error: any) {
    // 401 = server is reachable but token invalid — still counts as "online"
    if (error?.response?.status === 401) return true;
    return false;
  }
};

/**
 * Signup new user
 * Note: Your backend expects location to be added to the User model
 */
export const signup = async (data: SignupData): Promise<{
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}> => {
  try {
    // Get location — optional, proceed without it if unavailable
    const location = await getCurrentLocation();

    // Send signup request (lat/lon omitted if location unavailable)
    const response = await api.post('/auth/signup', {
      ...data,
      ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}),
      lastActive: new Date().toISOString(),
    });

    if (response.data) {
      // Backend signup returns { message: "Successful SignUp", token: '...' } in body
      // and also sets it as the 'user_token' cookie (both paths covered below).
      const jwt: string | undefined = response.data.token || response.data.access_token;
      if (jwt) {
        await storeAuthToken(jwt);
        console.log('✅ Signup successful - Token stored');
      } else {
        console.warn('⚠️ No token in signup response');
      }
      
      // Fetch user data
      const userResponse = await api.get<User>('/auth/loggedIn');
      if (userResponse.data) {
        await storeUserData(userResponse.data);
        await setHasLoggedIn();

        return {
          success: true,
          message: response.data.message,
          user: userResponse.data,
          token: jwt,
        };
      }
    }

    return {
      success: false,
      message: 'Signup failed',
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);

    // No response = network-level failure (server asleep on Render free tier, no connection, etc.)
    if (!error.response) {
      return {
        success: false,
        message: 'Cannot reach the server. Check your internet connection and try again. If the problem persists, the server may be waking up — wait a moment and retry.',
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Signup failed. Please try again.',
    };
  }
};

/**
 * Login with credentials
 */
export const login = async (data: LoginData): Promise<{
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}> => {
  try {
    const response = await api.post('/auth/login', data);

    if (response.data) {
      // Try every possible location the JWT might appear in the login response.

      // 1. Response body (most reliable on React Native)
      let jwt: string | undefined =
        response.data.token ||
        response.data.access_token ||
        response.data.jwt;

      // 2. Set-Cookie header — often accessible in React Native's native HTTP stack
      if (!jwt) {
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
          const match = cookieStr?.match?.(/user_token=([^;]+)/);
          if (match) jwt = match[1];
        }
      }

      // 3. x-access-token / authorization response header
      if (!jwt) {
        const xat = response.headers['x-access-token'];
        const authHeader = response.headers['authorization'];
        jwt = xat || (authHeader ? String(authHeader).replace('Bearer ', '') : undefined);
      }

      if (jwt) {
        await storeAuthToken(jwt);
        console.log('✅ Login successful - JWT stored in SecureStore');
      } else {
        console.warn('⚠️ No JWT found in login response — session relies on cookie only (will not persist across app restarts)');
      }

      // Fetch user profile; the cookie set by /auth/login is sent automatically
      // because withCredentials: true is set on the api instance.
      const userResponse = await api.get<User>('/auth/loggedIn');
      if (userResponse.data) {
        await storeUserData(userResponse.data);
        await setHasLoggedIn();

        return {
          success: true,
          message: response.data.message,
          user: userResponse.data,
          token: jwt,
        };
      }
    }

    return {
      success: false,
      message: 'Login failed',
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed. Please check your credentials.',
    };
  }
};

/**
 * Login with biometric authentication
 * Note: With cookie-based auth, we just verify biometric then check if cookie is still valid
 */
export const loginWithBiometric = async (): Promise<{
  success: boolean;
  message?: string;
  requiresOnlineLogin?: boolean;
}> => {
  try {
    // Check if user has logged in before
    const hasLoggedIn = await hasLoggedInBefore();
    if (!hasLoggedIn) {
      return {
        success: false,
        message: 'Please login online first',
        requiresOnlineLogin: true,
      };
    }

    // Check if biometric is enabled
    const biometricEnabled = await isBiometricEnabled();
    if (!biometricEnabled) {
      return {
        success: false,
        message: 'Biometric authentication not enabled',
      };
    }

    // Check if device supports biometric
    const canUse = await canUseBiometric();
    if (!canUse) {
      return {
        success: false,
        message: 'Biometric authentication not available on this device',
      };
    }

    // Authenticate with biometric
    const authResult = await authenticateWithBiometric();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.error || 'Biometric authentication failed',
      };
    }

    // Try to validate cookie with backend (if online)
    const online = await isOnline();
    if (online) {
      try {
        const response = await api.get<User>('/auth/loggedIn');
        if (response.status === 200 && response.data) {
          // Update user data
          await storeUserData(response.data);
          return { success: true };
        }
      } catch (error) {
        // Server unreachable or session invalid — do NOT wipe stored credentials.
        // The server may just be restarting (Render free-tier). The stored token
        // and user data stay intact so the user remains "logged in" locally.
        return {
          success: false,
          message: 'Unable to verify session with server. Please log in manually.',
          requiresOnlineLogin: true,
        };
      }
    }

    // Offline mode - trust local data
    const userData = await getUserData();
    if (userData) {
      return { success: true };
    }

    return {
      success: false,
      message: 'No user data found. Please login online.',
      requiresOnlineLogin: true,
    };
  } catch (error) {
    console.error('Biometric login error:', error);
    return {
      success: false,
      message: 'Biometric login failed',
    };
  }
};

/**
 * Setup biometric authentication after successful login
 */
export const setupBiometric = async (): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const canUse = await canUseBiometric();
    if (!canUse) {
      return {
        success: false,
        message: 'Biometric authentication not available',
      };
    }

    await enableBiometric();
    return {
      success: true,
      message: 'Biometric authentication enabled',
    };
  } catch (error) {
    console.error('Setup biometric error:', error);
    return {
      success: false,
      message: 'Failed to enable biometric authentication',
    };
  }
};

/**
 * Get current user from local storage
 */
export const getCurrentUser = async (): Promise<User | null> => {
  return await getUserData();
};

/**
 * Check if user is authenticated (has logged in before and has local data)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const hasLoggedIn = await hasLoggedInBefore();
  const userData = await getUserData();
  return hasLoggedIn && !!userData;
};

/**
 * Logout user - Call backend to clear cookie
 */
export const logout = async (): Promise<void> => {
  try {
    // Call backend to clear cookie
    await api.get('/auth/logOut');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local data
    await clearAuthData();
  }
};

/**
 * Complete logout (removes all data including login history)
 */
export const completeLogout = async (): Promise<void> => {
  try {
    // Call backend to clear cookie
    await api.get('/auth/logOut');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all local data
    await clearAllData();
  }
};