import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from './GlassView';

interface ChatBubbleProps {
    message: string;
    isMe: boolean;
    avatar?: string;
    name?: string;
    image?: string; // For image attachments
    read?: boolean;
    time?: string;
}

import { useTheme } from '../context/ThemeContext';

export const ChatBubble = ({ message, isMe, avatar, name, image, read, time }: ChatBubbleProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    if (isMe) {
        return (
            <Animated.View style={[styles.container, styles.containerMe, { opacity: fadeAnim }]}>
                <View style={styles.internalContainerMe}>
                    <LinearGradient
                        colors={['rgba(17, 212, 30, 0.8)', 'rgba(14, 166, 24, 0.9)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.bubbleMe, { borderColor: colors.glassBorder }]}
                    >
                        <View style={[styles.glassEffectMe, { backgroundColor: colors.glassBackground }]} />
                        <Text style={styles.textMe}>{message}</Text>
                    </LinearGradient>
                    {read && (
                        <View style={styles.readContainer}>
                            <Text style={[styles.readText, { color: colors.icon }]}>Read {time}</Text>
                            <Text style={[styles.checkIcon, { color: colors.primaryGreen }]}>✓✓</Text>
                            {/* Replace checkIcon with MaterialIcon in parent if needed, purely text for now to save props */}
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.container, styles.containerOther, { opacity: fadeAnim }]}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: avatar }} style={[styles.avatar, { borderColor: colors.glassBorder }]} />
            </View>
            <View style={styles.bubbleColumn}>
                <Text style={[styles.nameOther, { color: colors.icon }]}>{name}</Text>
                <GlassView style={styles.bubbleOther}>
                    {message && <Text style={[styles.textOther, { color: colors.text }]}>{message}</Text>}
                    {image && (
                        <View style={styles.imageAttachmentContainer}>
                            <Image source={{ uri: image }} style={styles.imageAttachment} contentFit="cover" />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.6)']}
                                style={styles.imageOverlay}
                            >
                                <Text style={styles.viewDetailsText}>👁 View details</Text>
                            </LinearGradient>
                        </View>
                    )}
                </GlassView>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        maxWidth: '100%',
        flexDirection: 'row',
    },
    containerMe: {
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
        maxWidth: '80%',
    },
    internalContainerMe: {
        alignItems: 'flex-end',
    },
    containerOther: {
        justifyContent: 'flex-start',
        alignSelf: 'flex-start',
        maxWidth: '85%',
        gap: 12,
    },
    avatarContainer: {
        alignSelf: 'flex-end',
        marginBottom: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
    },
    bubbleColumn: {
        flex: 1,
    },
    nameOther: {
        fontSize: 10,
        marginLeft: 4,
        marginBottom: 2,
    },
    bubbleMe: {
        padding: 14,
        borderRadius: 20,
        borderBottomRightRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
    },
    glassEffectMe: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    bubbleOther: {
        padding: 14,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
    },
    textMe: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    textOther: {
        fontSize: 14,
        lineHeight: 20,
    },
    readContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginRight: 4,
        gap: 4,
    },
    readText: {
        fontSize: 10,
    },
    checkIcon: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    imageAttachmentContainer: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: 16 / 9,
        width: '100%',
    },
    imageAttachment: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
    },
    viewDetailsText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    }

});