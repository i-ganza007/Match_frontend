import { Tabs } from "expo-router"
import React from "react"
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ headerShown: false, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="home" options={{ headerShown: false, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="breed-camera" options={{ headerShown: false, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="messages" options={{ headerShown: false, tabBarStyle: { display: "none" } }} />
    </Tabs>
  )
}