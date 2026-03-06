import api from './api';

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
  lastActive?: string;
  location?: any; // raw PostGIS geography value
}

// ---------------------------------------------------------------------------
// PostGIS location parsing
// ---------------------------------------------------------------------------
// Prisma returns Unsupported("geography(Point, 4326)") as a raw EWKB hex
// string, e.g. "0120000020E6100000<8-byte-lon><8-byte-lat>".
// We decode it with a DataView so we don't need any native Buffer module.

function parseEWKB(hex: string): { latitude?: number; longitude?: number } {
  try {
    if (!hex || hex.length < 42 || !/^[0-9a-fA-F]+$/i.test(hex)) return {};
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    const view = new DataView(bytes.buffer);
    const le = view.getUint8(0) === 1; // byte order: 01 = little-endian
    const wkbType = view.getUint32(1, le);
    const hasSRID = (wkbType & 0x20000000) !== 0;
    const offset = 5 + (hasSRID ? 4 : 0); // skip byte-order + type + optional SRID
    const longitude = view.getFloat64(offset, le);
    const latitude = view.getFloat64(offset + 8, le);
    if (
      isFinite(longitude) && isFinite(latitude) &&
      longitude >= -180 && longitude <= 180 &&
      latitude >= -90 && latitude <= 90
    ) {
      return { latitude, longitude };
    }
  } catch (e) {
    console.error('❌ EWKB parse error:', e);
  }
  return {};
}

function parseLocation(user: any): { latitude?: number; longitude?: number } {
  // Case 1: backend already returned separate numeric fields
  if (typeof user.latitude === 'number' && typeof user.longitude === 'number') {
    return { latitude: user.latitude, longitude: user.longitude };
  }

  if (!user.location) return {};

  try {
    // Case 2: GeoJSON object { type: "Point", coordinates: [lon, lat] }
    if (typeof user.location === 'object' && Array.isArray(user.location.coordinates)) {
      const [longitude, latitude] = user.location.coordinates;
      return { latitude, longitude };
    }

    if (typeof user.location === 'string') {
      // Case 3: raw EWKB hex string from PostGIS (Prisma Unsupported type)
      if (/^[0-9a-fA-F]+$/i.test(user.location) && user.location.length >= 42) {
        const coords = parseEWKB(user.location);
        if (coords.latitude !== undefined) return coords;
      }

      // Case 4: WKT string "POINT(lon lat)"
      const wkt = user.location.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
      if (wkt) {
        return { longitude: parseFloat(wkt[1]), latitude: parseFloat(wkt[2]) };
      }
    }

    console.warn('⚠️ Unknown location format:', typeof user.location, user.location);
  } catch (e) {
    console.error('❌ Error parsing location:', e);
  }

  return {};
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/users');
    console.log('✅ Users API response status:', response.status);

    let users: any[] = Array.isArray(response.data)
      ? response.data
      : response.data?.users ?? [];

    console.log(`✅ Raw users from API: ${users.length}`);

    // Attach parsed latitude/longitude to every user
    users = users.map((user: any) => {
      const { latitude, longitude } = parseLocation(user);
      if (latitude !== undefined && longitude !== undefined) {
        console.log(`📍 ${user.name}: lat=${latitude.toFixed(4)}, lon=${longitude.toFixed(4)}`);
      }
      return { ...user, latitude, longitude };
    });

    const withLocation = users.filter((u) => u.latitude != null && u.longitude != null);
    console.log(`✅ ${withLocation.length}/${users.length} users have valid location`);

    return users as User[];
  } catch (error: any) {
    console.error('❌ getAllUsers error:', error.response?.status, error.message);
    if (error.response?.status === 401) throw new Error('Unauthorized: Please log in to view users');
    if (error.response?.status === 403) throw new Error('Forbidden: You do not have permission to view users');
    if (error.response?.status >= 500) throw new Error('Server error: Please try again later');
    if (error.code === 'ECONNABORTED') throw new Error('Request timeout: Please check your internet connection');
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch users');
  }
};

export const getUsersWithLocation = async (): Promise<User[]> => {
  const users = await getAllUsers();
  return users.filter((u) => u.latitude != null && u.longitude != null);
};
