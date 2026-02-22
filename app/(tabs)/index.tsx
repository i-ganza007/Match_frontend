import { View, Text, Image } from 'react-native'
import { StyleSheet } from 'react-native'
import IndexTab from '@/components/IndexTab'
import React from 'react'
export default function Index(){
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/splash-icon.png')} style={styles.logo} resizeMode="contain"/>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>MATCH</Text>
        <Text style={styles.subtitle}>GENETIC EXCELLENCE</Text>
      </View>

      <IndexTab/>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a2e1a", 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20,
    maxHeight:"auto"
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
    color: "#FFFFFF",
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