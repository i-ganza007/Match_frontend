import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export type PermissionResult =
  | { granted: true }
  | { granted: false; canAskAgain: boolean };

/**
 * Request location permission.
 * Returns whether it was granted and — if not — whether the OS will show the
 * dialog again or if the user needs to go to Settings.
 */
export const requestLocationPermission = async (): Promise<PermissionResult> => {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') return { granted: true };
    return { granted: false, canAskAgain };
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return { granted: false, canAskAgain: false };
  }
};

/**
 * Check current permission status without triggering a dialog.
 */
export const hasLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Get current location coordinates
 */
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  try {
    const alreadyGranted = await hasLocationPermission();

    if (!alreadyGranted) {
      const result = await requestLocationPermission();
      if (!result.granted) return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Get address from coordinates (reverse geocoding)
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<Location.LocationGeocodedAddress | null> => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      return addresses[0];
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};