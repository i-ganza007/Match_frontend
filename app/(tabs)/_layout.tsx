import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: "none" }, // custom nav built into each screen
            }}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="home" />
            <Tabs.Screen name="breed-camera" />
            <Tabs.Screen name="messages" />
            <Tabs.Screen name="register-animal" />
            <Tabs.Screen name="animal-profile" />
            <Tabs.Screen name="animal-performance" />
            <Tabs.Screen name="my-herd" />
            <Tabs.Screen name="cattle-herd" />
            <Tabs.Screen name="sheep-pig-herd" />
            <Tabs.Screen name="login" />
            <Tabs.Screen name="quick-matches-map" />
            <Tabs.Screen name="(genetics)" />
        </Tabs>
    );
}
