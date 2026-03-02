import { View, Text, Image } from 'react-native'
import { StyleSheet } from 'react-native'
import IndexTab from '@/components/IndexTab'
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
export default function Index() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>MATCH</Text>
        <Text style={styles.subtitle}>GENETIC EXCELLENCE</Text>
      </View>

      <IndexTab />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    maxHeight: "auto"
  },
  logoContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  mainTitle: {
    fontWeight: "600",
    fontSize: 36,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontWeight: "400",
    fontSize: 16,
    color: "#888888",
    textAlign: 'center',
    marginTop: 3,
    letterSpacing: 1,
  },
})