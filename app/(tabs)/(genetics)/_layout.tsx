import { Stack } from 'expo-router';
import React from 'react';

export default function GeneticsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="pedigree" />
            <Stack.Screen name="lineage-verification" />
            <Stack.Screen name="siamese-analysis" />
        </Stack>
    );
}
