import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

interface GlassViewProps {
    children: React.ReactNode;
    style?: any;
    bright?: boolean;
}

export const GlassView = ({ children, style, bright = false }: GlassViewProps) => {
    const { theme, colors } = useTheme();
    const isDark = theme === 'dark';

    const containerStyle = {
        backgroundColor: bright
            ? (isDark ? 'rgba(17, 212, 30, 0.15)' : 'rgba(17, 212, 30, 0.2)')
            : colors.glassBackground,
        borderColor: bright
            ? (isDark ? 'rgba(17, 212, 30, 0.3)' : 'rgba(17, 212, 30, 0.4)')
            : colors.glassBorder,
    };

    if (Platform.OS === 'ios') {
        return (
            <BlurView
                intensity={bright ? 40 : (isDark ? 20 : 40)}
                tint={isDark ? "dark" : "light"}
                style={[
                    styles.glass,
                    containerStyle,
                    style
                ]}
            >
                {children}
            </BlurView>
        );
    }

    return (
        <View style={[
            styles.glass,
            containerStyle,
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    glass: {
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
});