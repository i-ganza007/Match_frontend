import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import React from 'react'
const { width } = Dimensions.get('window');

export default function IndexTab() {
  const router = useRouter();
  return (
    <View style={styles.glassContainer}>
      {/* Glass effect overlay */}
      <View style={styles.glassOverlay} />

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Empowering Growth</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.subtitle}>Premium livestock genetic matching for Rwanda's dedicated smallholder farmers.</Text>
        </View>

        <View style={styles.buttonSection}>
          <Link href="/signup" asChild>
            <Button
              mode="contained"
              style={styles.primaryButton}
              buttonColor="#1C5F20"
              textColor="#FFFFFF"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
            >
              Get Started
              <AntDesign name="arrow-right" size={14} style={{ marginLeft: 10 }} color="white" />
            </Button>
          </Link>
          <Link href="/login" asChild>
            <Button
              mode="outlined"
              style={styles.secondaryButton}
              textColor="#FFFFFF"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonText}
            >
              Login to Account
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    width: width * 0.9,
    minHeight: 320,
    borderRadius: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    // Glass border
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    borderRadius: 20,
    // Glassmorphism effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    // Additional glass effects
    opacity: 0.9,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 35,
    zIndex: 1, // Above the glass overlay
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  primaryButton: {
    width: '90%',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    fontWeight: '600',

  },
  secondaryButton: {
    width: '90%',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '600',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});