import { Tabs } from "expo-router";
import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // all tabs hidden by default; nav is custom
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="breed-camera" />
      <Tabs.Screen name="messages" />
      {/* Genetics group – keeps its stack but tab bar is hidden (custom nav in home.tsx) */}
      <Tabs.Screen name="(genetics)" />
    </Tabs>
  );
}