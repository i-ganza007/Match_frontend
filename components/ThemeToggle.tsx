import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassView } from './GlassView';

interface ThemeToggleProps {
    size?: number;
    showGlass?: boolean;
}

export const ThemeToggle = ({ size = 24, showGlass = true }: ThemeToggleProps) => {
    const { theme, toggleTheme, colors } = useTheme();
    const isDark = theme === 'dark';

    const content = (
        <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={size}
            color={colors.primaryGreen}
        />
    );

    return (
        <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7}>
            {showGlass ? (
                <GlassView style={styles.container}>
                    {content}
                </GlassView>
            ) : (
                content
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});