import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getUsersWithLocation, User } from '../services/users';
import { useTheme } from '../context/ThemeContext';
import { isOnline } from '../services/auth';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

// Rwanda bounds for coordinate mapping
const RWANDA_BOUNDS = {
  minLat: -2.84,
  maxLat: -1.05,
  minLng: 28.86,
  maxLng: 30.90,
};

export default function UsersMapScreen() {
  const { colors, isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await getUsersWithLocation();
      setUsers(fetchedUsers);
      console.log(`✅ Loaded ${fetchedUsers.length} users with location data`);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    try {
      console.log('🔍 Testing authentication...');
      
      // Test 1: Check if logged in
      const loggedIn = await isOnline();
      console.log('✅ Auth check (isOnline):', loggedIn);
      
      // Test 2: Try to get current user
      try {
        const userResponse = await api.get('/auth/loggedIn');
        console.log('✅ Current user:', userResponse.data);
      } catch (err: any) {
        console.error('❌ Get current user failed:', err.response?.status, err.message);
      }
      
      // Test 3: Try to get users directly
      try {
        const usersResponse = await api.get('/users');
        console.log('✅ Users response:', usersResponse.data);
        Alert.alert('Auth Test', `Success! Found ${Array.isArray(usersResponse.data) ? usersResponse.data.length : 'N/A'} users`);
      } catch (err: any) {
        console.error('❌ Get users failed:', err.response?.status, err.response?.data, err.message);
        Alert.alert('Auth Test Failed', `Status: ${err.response?.status}\nMessage: ${err.response?.data?.message || err.message}`);
      }
    } catch (error: any) {
      console.error('❌ Test auth error:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Convert lat/lng to x/y position on the map
  const coordsToPosition = (lat: number, lng: number) => {
    const mapWidth = width - 32;
    const mapHeight = 400;
    
    const x = ((lng - RWANDA_BOUNDS.minLng) / (RWANDA_BOUNDS.maxLng - RWANDA_BOUNDS.minLng)) * mapWidth;
    const y = ((RWANDA_BOUNDS.maxLat - lat) / (RWANDA_BOUNDS.maxLat - RWANDA_BOUNDS.minLat)) * mapHeight;
    
    return { x, y };
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#11d41e" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading users...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={48} color="#ff4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error.includes('401') || error.includes('Unauthorized') 
            ? 'Please log in to view users' 
            : error}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#888' }]} onPress={testAuth}>
            <Text style={styles.retryText}>🔍 Test Auth</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUsers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state (successful fetch but no users)
  if (users.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="person-off" size={48} color="#888" />
        <Text style={[styles.errorText, { color: colors.text }]}>No users found with location data</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#888' }]} onPress={testAuth}>
            <Text style={styles.retryText}>🔍 Test Auth</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUsers}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Stats Header */}
        <View style={styles.statsHeader}>
          <View style={[styles.statCard, { backgroundColor: colors.glassBackground }]}>
            <MaterialIcons name="people" size={24} color="#11d41e" />
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>{users.length}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.glassBackground }]}>
            <MaterialIcons name="male" size={24} color="#4A90E2" />
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {users.filter(u => u.sex === 'MALE').length}
              </Text>
              <Text style={styles.statLabel}>Male</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.glassBackground }]}>
            <MaterialIcons name="female" size={24} color="#E91E63" />
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {users.filter(u => u.sex === 'FEMALE').length}
              </Text>
              <Text style={styles.statLabel}>Female</Text>
            </View>
          </View>
        </View>

        {/* Map Visualization */}
        <View style={styles.mapSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Users Distribution Map</Text>
          <View style={[styles.mapContainer, { backgroundColor: colors.glassBackground }]}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0wmewPGMAiKRUfzoZwc-2yr3RdJSYCOW3milMOhVLs7qaX_gSJ0J34z5nTwWIVH3xZz1Q-gxCv87Drc0tduJWDFK91xS3K1eLY5aQoR4FSTM7D9F4nWFDBAwsKrdEWKNRxAj-NL2yHTrCBh0wNO22J37R_wSPy5vuQWeZ4-CF2tv6n11Rd2qV4qojLDv4VSDAtL5gFP-8O3JkmejfkcNmBkjU4AdQuX-VSRIifCkqm9ec-AaloaS1HUPfQtjTP5Djw95SGc2WCHE' }}
              style={styles.mapImage}
            />
            
            {/* User markers */}
            {users.map((user) => {
              const position = coordsToPosition(user.latitude!, user.longitude!);
              return (
                <TouchableOpacity
                  key={user.userId}
                  style={[
                    styles.marker,
                    {
                      left: position.x - 16,
                      top: position.y - 16,
                      backgroundColor: user.sex === 'MALE' ? '#4A90E2' : '#E91E63',
                    }
                  ]}
                  onPress={() => setSelectedUser(selectedUser?.userId === user.userId ? null : user)}
                >
                  <MaterialIcons name="person" size={20} color="#fff" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Users List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All Users ({users.length})</Text>
          {users.map((user) => (
            <TouchableOpacity
              key={user.userId}
              style={[
                styles.userCard,
                { backgroundColor: colors.glassBackground },
                selectedUser?.userId === user.userId && styles.userCardSelected
              ]}
              onPress={() => setSelectedUser(selectedUser?.userId === user.userId ? null : user)}
            >
              <View style={styles.userHeader}>
                <View style={[
                  styles.userAvatar,
                  { backgroundColor: user.sex === 'MALE' ? '#4A90E2' : '#E91E63' }
                ]}>
                  <MaterialIcons name="person" size={28} color="#fff" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                  <Text style={styles.userPhone}>{user.phone_number}</Text>
                  <View style={styles.locationRow}>
                    <MaterialIcons name="location-on" size={14} color="#11d41e" />
                    <Text style={styles.locationText}>
                      {user.district}, {user.sector}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.genderBadge,
                  { backgroundColor: user.sex === 'MALE' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(233, 30, 99, 0.2)' }
                ]}>
                  <MaterialIcons 
                    name={user.sex === 'MALE' ? 'male' : 'female'} 
                    size={16} 
                    color={user.sex === 'MALE' ? '#4A90E2' : '#E91E63'} 
                  />
                </View>
              </View>
              
              {selectedUser?.userId === user.userId && (
                <View style={styles.userDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="home" size={16} color="#11d41e" />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {user.village}, {user.cell}
                    </Text>
                  </View>
                  {user.email && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="email" size={16} color="#11d41e" />
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        {user.email}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <MaterialIcons name="location-searching" size={16} color="#11d41e" />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {user.latitude?.toFixed(4)}, {user.longitude?.toFixed(4)}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#11d41e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsHeader: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mapSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mapContainer: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  marker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userCardSelected: {
    borderColor: '#11d41e',
    borderWidth: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  genderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
});
