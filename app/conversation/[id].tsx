import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassView } from '../../components/GlassView';
import { ChatBubble } from '../../components/ChatBubble';
import { ChatInput } from '../../components/ChatInput';

import { useTheme } from '../../context/ThemeContext';

export default function ConversationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, name, avatar } = params;
    const scrollViewRef = useRef<ScrollView>(null);
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    // Mock data based on provided HTML
    const messages = [
        {
            id: '1',
            text: 'Muraho! I received your inquiry about the Jersey bull genetics.',
            isMe: false,
            time: '9:41 AM',
        },
        {
            id: '2',
            text: 'Yes, I am looking to improve milk yield for the next season. Is he available?',
            isMe: true,
            time: '9:45 AM',
            read: true,
        },
        {
            id: '3',
            text: 'He is available. Here is his recent health certificate and profile.',
            isMe: false,
            time: '9:46 AM',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNquQW5mLuXUAmbHg_VGLI2NTWh-PQD56BNJTxQOIprN2BL1OKpDfv8GlNVb4Qab4-IneE-a5I3dv7y65rZY0qCaWRoca5RTgsZizc-hMmz8cvAZ_4GYNFXX0wRiy_jJO5U6-YleAGIwO2e-Xsjc6lz9KKRU_cw_t1r4UnS8HF3WFAIo9HnjNlVd7Vygdv1LDNesgj-T5QYLI8Zifsf8P8czdo0UJXIO1wJe0Nu_B4TrfzOrJ2tBGIIpq_98eSgZEOR6Pn3CmkTO0',
        },
        {
            id: '4',
            text: 'Perfect. Can we meet to finalize?',
            isMe: true,
            time: '9:48 AM',
        }
    ];

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
                                <Image source={{ uri: (avatar as string) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHJ0AROg-JwtBI-y-7F6T_jNHjEtdWk_ekKZRZWKq90E-zGkYjnrbpMku4dlmtag9MutuPN19JnBIAVdXFL1tdj708nc35VujaLaMyf8txSdAgICcqTEJ8QUGAOMcpcgm2fhQn-LxQOpg9Og8gmYwzqIV3RukUUH2uWgm5lXqMxYdNVGwHu59Z7lE4Q1cN10SxAjRYsu8zF0wgT_6Mspy2xMBORNq2rlbFHYOwy32Ayo-XeC77s1_CkWba2eujyDMDDwiM10PHY8E' }} style={styles.avatar} />
                            </View>
                            <View style={[styles.miniIconBadge, { backgroundColor: colors.surface }]}>
                                <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA36yzkoJYk1pxOPssbpWghdqDoMcHa3et43FOoCT8RAlIGl1XxvelF3E-2wH_GoP4Y8-tDix7B8sNisZO9ux2oL9rAfKy7VCyG9uhel9sFnL3o0x2k7K8Bn5AD1N-f3Vt1q2jJZ9833mVFq7k2TMiHz_Ac3O2NXnQAylV4In1G74gSpsftoHuAQsg-MEeoFKbR6JVIQPGdQOs8N_ptouQisSU2blXdEoAtzTKQHgMJ5AlKCWGYyKXPuXHlLQCQxbZ10Q1RQggsx5o' }} style={styles.miniIcon} contentFit="contain" />
                            </View>
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={[styles.headerName, { color: colors.text }]}>{(name as string) || 'Jean-Paul (Breeder)'}</Text>
                            <Text style={[styles.headerStatus, { color: isDark ? '#bbf7d0' : '#166534' }]}>Active now</Text>
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
                            avatar={(avatar as string) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHJ0AROg-JwtBI-y-7F6T_jNHjEtdWk_ekKZRZWKq90E-zGkYjnrbpMku4dlmtag9MutuPN19JnBIAVdXFL1tdj708nc35VujaLaMyf8txSdAgICcqTEJ8QUGAOMcpcgm2fhQn-LxQOpg9Og8gmYwzqIV3RukUUH2uWgm5lXqMxYdNVGwHu59Z7lE4Q1cN10SxAjRYsu8zF0wgT_6Mspy2xMBORNq2rlbFHYOwy32Ayo-XeC77s1_CkWba2eujyDMDDwiM10PHY8E'}
                            name={msg.isMe ? 'Me' : (name as string)?.split(' ')[0] || 'Jean-Paul'}
                            image={msg.image}
                            read={msg.read}
                            time={msg.time}
                        />
                    ))}
                </ScrollView>

                {/* Bottom Areas */}
                <View style={styles.footer}>
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
                        <ChatInput onSend={(text) => console.log('Sending:', text)} />
                    </View>
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
    inputWrapper: {

    }
});