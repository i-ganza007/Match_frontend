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
}

/**
 * Fetch all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/users');
    console.log('✅ Users API response:', response.data);
    console.log('✅ Response status:', response.status);
    
    // Handle different response formats
    const users = Array.isArray(response.data) ? response.data : response.data?.users || [];
    console.log(`✅ Parsed ${users.length} users from response`);
    return users;
  } catch (error: any) {
    console.error('❌ Get all users error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Unauthorized: Please log in to view users');
    } else if (error.response?.status === 403) {
      throw new Error('Forbidden: You do not have permission to view users');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error: Please try again later');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout: Please check your internet connection');
    } else {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }
};

/**
 * Fetch users with location data only
 */
export const getUsersWithLocation = async (): Promise<User[]> => {
  try {
    const users = await getAllUsers();
    return users.filter(user => user.latitude && user.longitude);
  } catch (error: any) {
    console.error('Get users with location error:', error);
    throw error;
  }
};
