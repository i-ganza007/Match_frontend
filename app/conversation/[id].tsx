import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { ChatBubble } from '../../components/ChatBubble';
import { ChatInput } from '../../components/ChatInput';
import { getSingleUser, User } from '../../services/users';
import { useSocket, IncomingMessage } from '../../services/useSocket';

import { useTheme } from '../../context/ThemeContext';

type Message = {
    id: string;
    text: string;
    isMe: boolean;
    time: string;
    read?: boolean;
    image?: string;
};

export default function ConversationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, name, avatar, isMatch } = params;
    const canMessage = isMatch === 'true';

    const scrollViewRef = useRef<ScrollView>(null);
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const [partnerUser, setPartnerUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const { isConnected, sendMessage, onMessage } = useSocket();

    useEffect(() => {
        if (!id) return;
        getSingleUser(id as string)
            .then(setPartnerUser)
            .catch(() => { /* fall back to route params */ });
    }, [id]);

    // Listen for incoming messages from this conversation partner
    useEffect(() => {
        if (!canMessage) return;
        const cleanup = onMessage((msg: IncomingMessage) => {
            if (msg.from !== id) return; // ignore messages from other chats
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    text: msg.message,
                    isMe: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        });
        return cleanup;
    }, [id, canMessage, onMessage]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    const displayName   = partnerUser?.name   ?? (name as string)   ?? 'Farmer';
    const displayAvatar = partnerUser?.profile_url ?? (avatar as string) ?? '';

    async function handleSend(text: string) {
        if (!text.trim() || !canMessage) return;

        // Optimistic update
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                text,
                isMe: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ]);

        await sendMessage(id as string, text);
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Background Layer using ImageBackground for zoom effect simulation or just static cover */}
            <ImageBackground
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxI_IUze0V2zQ3Q4EvlddshMWYb6g1T7lBSGUeltWjnxI8kL2da3aQKgcj6rB8ifwwZH90stzVy8N41xhIhsSUm3r0pnJRZqZNUVGrNBJ9xdjVH54OwHIrootCgq7hEhImtFctCrAui-n5e-sccRCSidkyLWWuiP-Q_ZewRw230vRMu5EO9fsYcHBtQHt4DJKVLWfaUZF8aPKusrPgU70DTKfThhP-f4pqWPU-iESScUvn-f1u817BfbouvhMfEa7jg1mOorXW2EM' }}
                style={styles.backgroundImage}
                blurRadius={5} // Native blur
            >
                <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)' }]} />
            </ImageBackground>

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header */}
                <GlassView style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.headerProfile}>
                        <View>
                            <View style={styles.avatarWrapper}>
                                <Image source={{ uri: displayAvatar || undefined }} style={styles.avatar} />
                            </View>
                            <View style={[styles.miniIconBadge, { backgroundColor: colors.surface }]}>
                                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA36yzkoJYk1pxOPssbpWghdqDoMcHa3et43FOoCT8RAlIGl1XxvelF3E-2wH_GoP4Y8-tDix7B8sNisZO9ux2oL9rAfKy7VCyG9uhel9sFnL3o0x2k7K8Bn5AD1N-f3Vt1q2jJZ9833mVFq7k2TMiHz_Ac3O2NXnQAylV4In1G74gSpsftoHuAQsg-MEeoFKbR6JVIQPGdQOs8N_ptouQisSU2blXdEoAtzTKQHgMJ5AlKCWGYyKXPuXHlLQCQxbZ10Q1RQggsx5o' }} style={styles.miniIcon} contentFit="contain" />
                            </View>
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={[styles.headerName, { color: colors.text }]}>{displayName}</Text>
                            <Text style={[styles.headerStatus, { color: isConnected ? (isDark ? '#bbf7d0' : '#166534') : colors.icon }]}>
                                {isConnected ? 'Active now' : 'Connecting...'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <MaterialIcons name="info-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </GlassView>

                {/* Chat Area */}
                <ScrollView
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    ref={scrollViewRef}
                >
                    <View style={styles.dateDivider}>
                        <GlassView style={[styles.dateBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]} bright={false}>
                            <Text style={[styles.dateText, { color: colors.icon }]}>Today, 9:41 AM</Text>
                        </GlassView>
                    </View>

                    {messages.map((msg) => (
                        <ChatBubble
                            key={msg.id}
                            message={msg.text}
                            isMe={msg.isMe}
                            avatar={displayAvatar || undefined}
                            name={msg.isMe ? 'Me' : displayName.split(' ')[0]}
                            image={msg.image}
                            read={msg.read}
                            time={msg.time}
                        />
                    ))}
                </ScrollView>

                {/* Bottom Areas */}
                <View style={styles.footer}>
                    {!canMessage ? (
                        <GlassView style={styles.matchGate}>
                            <MaterialIcons name="lock" size={20} color={colors.icon} />
                            <Text style={[styles.matchGateText, { color: colors.icon }]}>
                                Messaging is only available after a breed match is confirmed.
                            </Text>
                        </GlassView>
                    ) : (
                        <>
                            {/* Quick Actions */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions} style={styles.quickActionsContainer}>
                                <GlassView style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(16, 34, 17, 0.6)' : colors.glassBackground }]}>
                                    <View style={[styles.actionIconBg, { backgroundColor: isDark ? 'rgba(17, 212, 30, 0.2)' : 'rgba(17, 212, 30, 0.1)' }]}>
                                        <MaterialIcons name="photo-camera" size={16} color="#11d41e" />
                                    </View>
                                    <Text style={[styles.actionText, { color: isDark ? '#d1d5db' : colors.text }]}>Photo</Text>
                                </GlassView>
                                <GlassView style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(16, 34, 17, 0.6)' : colors.glassBackground }]}>
                                    <View style={[styles.actionIconBg, { backgroundColor: isDark ? 'rgba(17, 212, 30, 0.2)' : 'rgba(17, 212, 30, 0.1)' }]}>
                                        <MaterialIcons name="location-on" size={16} color="#11d41e" />
                                    </View>
                                    <Text style={[styles.actionText, { color: isDark ? '#d1d5db' : colors.text }]}>Location</Text>
                                </GlassView>
                                <GlassView style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(16, 34, 17, 0.6)' : colors.glassBackground }]}>
                                    <View style={[styles.actionIconBg, { backgroundColor: isDark ? 'rgba(17, 212, 30, 0.2)' : 'rgba(17, 212, 30, 0.1)' }]}>
                                        <MaterialIcons name="calendar-month" size={16} color="#11d41e" />
                                    </View>
                                    <Text style={[styles.actionText, { color: isDark ? '#d1d5db' : colors.text }]}>Meeting</Text>
                                </GlassView>
                                <GlassView style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(16, 34, 17, 0.6)' : colors.glassBackground }]}>
                                    <View style={[styles.actionIconBg, { backgroundColor: isDark ? 'rgba(17, 212, 30, 0.2)' : 'rgba(17, 212, 30, 0.1)' }]}>
                                        <MaterialIcons name="payments" size={16} color="#11d41e" />
                                    </View>
                                    <Text style={[styles.actionText, { color: isDark ? '#d1d5db' : colors.text }]}>Offer</Text>
                                </GlassView>
                            </ScrollView>

                            {/* Input */}
                            <View style={styles.inputWrapper}>
                                <ChatInput onSend={handleSend} />
                            </View>
                        </>
                    )}
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    headerProfile: {
        flex: 1,
        alignItems: 'center',
    },
    avatarWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#11d41e',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    miniIconBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        borderRadius: 10,
        padding: 2,
        elevation: 2,
    },
    miniIcon: {
        width: 16,
        height: 16,
    },
    headerTextContainer: {
        alignItems: 'center',
        marginTop: 4,
    },
    headerName: {
        fontSize: 14,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerStatus: {
        fontSize: 10,
        fontWeight: '500',
    },
    chatArea: {
        flex: 1,
    },
    chatContent: {
        padding: 16,
        paddingBottom: 20,
    },
    dateDivider: {
        alignItems: 'center',
        marginBottom: 20,
    },
    dateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dateText: {
        fontSize: 10,
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    quickActionsContainer: {
        marginBottom: 10,
        maxHeight: 70, // Constraints height for scrolling
    },
    quickActions: {
        gap: 8,
        paddingVertical: 5,
    },
    actionButton: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 70,
        borderRadius: 16,
        gap: 4,
    },
    actionIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 10,
        fontWeight: '500',
    },
    inputWrapper: {},
    matchGate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        marginBottom: 4,
    },
    matchGateText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});