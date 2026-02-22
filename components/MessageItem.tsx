import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from './GlassView';

interface MessageItemProps {
    name: string;
    message: string;
    time: string;
    avatar: string;
    unread?: boolean;
    online?: boolean;
    isMatch?: boolean; // For the "Golden Match" style
    onPress: () => void;
}

import { useTheme } from '../context/ThemeContext';

export const MessageItem = ({
    name,
    message,
    time,
    avatar,
    unread,
    online,
    isMatch,
    onPress
}: MessageItemProps) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    if (isMatch) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginBottom: 12 }}>
                <LinearGradient
                    colors={isDark ? ['rgba(234, 179, 8, 0.15)', 'transparent'] : ['rgba(234, 179, 8, 0.2)', colors.glassBackground]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.matchContainer, { borderColor: colors.gold + '66' }]}
                >
                    {/* Golden bar on left */}
                    <View style={[styles.goldenBar, { backgroundColor: colors.gold, shadowColor: colors.gold }]} />

                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: avatar }} style={[styles.avatar, styles.matchAvatarBorder]} />
                        {online && <View style={[styles.onlineBadge, { borderColor: colors.background }]} />}
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.nameMatch, { color: colors.gold }]} numberOfLines={1}>{name}</Text>
                            <Text style={[styles.timeMatch, { color: colors.gold }]}>{time}</Text>
                        </View>
                        <Text style={[styles.messageMatch, { color: isDark ? 'rgba(254, 243, 199, 0.9)' : '#854D0E' }]} numberOfLines={1}>{message}</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ marginBottom: 12 }}>
            <GlassView style={styles.container}>
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: avatar }} style={[styles.avatar, online ? {} : { opacity: 0.8 }]} />
                    {online ? (
                        <View style={[styles.onlineBadge, { borderColor: colors.background }]} />
                    ) : (
                        <View style={[styles.offlineBadge, { borderColor: colors.background }]} />
                    )}
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                        <Text style={[styles.time, { color: colors.icon }]}>{time}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        {message.includes("attached") && <MaterialIcons name="attach-file" size={14} color={colors.icon} />}
                        <Text style={[styles.message, { color: colors.icon }, unread && { color: colors.text, fontWeight: 'bold' }]} numberOfLines={1}>{message}</Text>
                    </View>
                </View>
            </GlassView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    matchContainer: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    matchBorder: {
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.4)',
    },
    goldenBar: {
        position: 'absolute',
        left: 0,
        top: '30%',
        bottom: '30%',
        width: 3,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    matchAvatarBorder: {
        borderWidth: 2,
        borderColor: 'rgba(234, 179, 8, 0.5)',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#11d41e',
        borderWidth: 2,
    },
    offlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#6b7280',
        borderWidth: 2,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    nameMatch: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
    },
    timeMatch: {
        fontSize: 12,
        fontWeight: '500',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    message: {
        fontSize: 14,
    },
    messageMatch: {
        fontSize: 14,
        fontWeight: '500',
    },
});