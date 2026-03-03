import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request location permission
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Check if location permission is granted
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
    const hasPermission = await hasLocationPermission();
    
    if (!hasPermission) {
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        throw new Error('Location permission not granted');
      }
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