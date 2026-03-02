import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../../components/GlassView';
import { MessageItem } from '../../components/MessageItem';

import { useTheme } from '../../context/ThemeContext';

export default function Messages() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const conversations = [
        {
            id: '1',
            name: 'Jean-Paul (Golden Match)',
            message: 'Is the bull available for transport to Musanze?',
            time: 'Now',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDz2fkWPuoSCSY-A6QT0DWMqeY42H3iwLgaQlgGQlNLkTz3hVv0vLxsrM-fUUyup0-7yHeJE7pvl4nb6lc_-77BZMDwZ5v6FWnS2g0hSqNf2JZIDLKx1xpadrVYPDTCHmArJxtSAoYOb6wWu3vh-kOc0xKbZibmFaqZrlWLylb0FCb_IAGzb0TxBUcapi7_61ByVy3jX30fnBF-P1TmwbWw-pCRS8UidubcaE4Ga023O-FVfbmeZbSDUMgexnI19pVLIxAJkNvGvxY',
            unread: true,
            online: true,
            isMatch: true,
        },
        {
            id: '2',
            name: 'Marie Uwase',
            message: 'Excellent milk yields reported from the last batch.',
            time: '2m ago',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfbueZVF_vLGlnUfVQQP3M0V5z3Y1PPcIGqYk9Fcs36AWbAteimZN98T87Xt7zOdYwiY_mOuauyeZnd1EOM2Hi6MFn9lpVhk1LbYpd6tfbbApaXX9vIt2aSIkWBmyB6mTKsOnTZVyCl0q76gP3pzGKJzlySgwkIxdEj1j62YAcYFTaJu7AT6Mmvo6N0UniHGKRQ9BMGveze1VCpEpq5sNw53f9rxwDav9jJ-Pn3nLlVK1-C4W7Lfm1EUVkk3l7-ycUZc48GfPOa1o',
            unread: false,
            online: true,
            isMatch: false,
        },
        {
            id: '3',
            name: 'Kigali Genetics',
            message: 'Genetic report attached for review.',
            time: '1h ago',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN4Oihws7n2R16y1yF6WTNRYrA3zs0idX-WucgFhA4Sdo65SnWUgcNyecwHwuxzX8OnevtdcCxFAkCyR1aZjpYNL7OE8KAOVlhCwQN5f9hRmqQavjP7IGHLQh4v0YTm77qiwngZ1QymI8ZnyJnf2KeGm0TnhgN5k5GdOaReqgCzGNQlcITr0fGryTZvLnpdpAkCZhrz_8t2rySaOMd7lB1ghV-QqQddqMmf8pVJYvBoOYfTLiI7F64jgC23lbjOO1r3-nmAZMMgok',
            unread: false,
            online: false,
            isMatch: false,
        },
        {
            id: '4',
            name: 'Emmanuel N.',
            message: 'Can we schedule a viewing for Saturday?',
            time: 'Yesterday',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-YK3WrDcycUpx5MwV_ETFUpR2L_yKbixNhY3qYDIpB90mQI-IWFDLdvCCIGa49lT5mVeTsQDgBj0fv25mo0uh_0B9wyx8KLel2f2h2LhzmBN8jS_7geCb2G_EHZ3FwnMlZR-i14vQBVTDTXMGsMVjCPub15j_vxeVkVT8Wsa5nMLgKCLYFAFdrtzTPAPTsMo3WMNGVXitvJv80ZTY2_c0USPu_TJaPYS6vMIejX9ylR--L6BgxDCogJq2PUqDc7DSdOb56DVP47g',
            unread: false,
            online: false,
            isMatch: false,
        },
        {
            id: '5',
            name: 'Cooperative Abahizi',
            message: 'The vaccination records are updated.',
            time: 'Yesterday',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8hzNT5OE4O4DaKW-_vyERXTzBWhbGE0A9qvdXhcHYOpNP32lUS_LUSPHrkFKq1Kl8pY9miiSqwhXmtG2L8Wl9AABd8C0uBbD6sjhxJlAuXbsfQ-AY3edP9kgyBmnVEo8OeDAIqkeSfL90fmJEBS88yaGe9Uh9MXO8099p0Ca86-UaquCt4tV743RpHzdEzIX7aG4C-qrzO12RMVtBG6I79WDkY_iNMR51CA_1-yRow5dqIGXaavx0amCC3aWwjCHK3U5J08wppJo',
            unread: false,
            online: false,
            isMatch: false,
        },
    ];

    const handlePress = (id: string, name: string, avatar: string) => {
        router.push({
            pathname: `/conversation/[id]`,
            params: { id, name, avatar }
        } as any);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {isDark && (
                <LinearGradient
                    colors={['#1a3c28', colors.background, '#050b05']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            )}

            {/* Background Ambient Glows */}
            <View style={[styles.glowTop, { opacity: isDark ? 1 : 0.5 }]} />
            <View style={[styles.glowBottom, { opacity: isDark ? 1 : 0.2 }]} />

            <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.glassBackground }]}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('messages.header', 'Messages')}</Text>
                <TouchableOpacity style={[styles.newChatBtn, { backgroundColor: colors.glassBackground }]}>
                    <Text style={[styles.newChatText, { color: colors.primaryGreen }]}>{t('messages.newChat', 'New Chat')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <GlassView style={styles.searchBar}>
                    <MaterialIcons name="search" size={20} color={colors.icon} />
                    <TextInput
                        placeholder={t('messages.searchPlaceholder', 'Search breeders or livestock...')}
                        placeholderTextColor={colors.icon}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                </GlassView>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {conversations.map((item) => (
                    <MessageItem
                        key={item.id}
                        {...item}
                        onPress={() => handlePress(item.id, item.name, item.avatar)}
                    />
                ))}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primaryGreen }]}>
                <MaterialIcons name="add-comment" size={28} color="#081209" />
            </TouchableOpacity>

            {/* Bottom Navigation */}
            <View style={styles.navContainer}>
                <GlassView style={styles.navBar}>
                    <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
                        <MaterialIcons name="home" size={24} color={colors.icon} />
                        <Text style={[styles.navText, { color: colors.icon }]}>{t('common.home', 'HOME')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="hub" size={24} color={colors.icon} />
                        <Text style={[styles.navText, { color: colors.icon }]}>{t('common.genetics', 'GENETICS')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="chat-bubble-outline" size={24} color={colors.primaryGreen} />
                        <Text style={[styles.navTextActive, { color: colors.primaryGreen }]}>{t('common.chat', 'CHAT')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <MaterialIcons name="person-outline" size={24} color={colors.icon} />
                        <Text style={[styles.navText, { color: colors.icon }]}>{t('common.profile', 'PROFILE')}</Text>
                    </TouchableOpacity>
                </GlassView>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    glowTop: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: 'rgba(17, 212, 30, 0.1)',
        transform: [{ scale: 1.5 }],
    },
    glowBottom: {
        position: 'absolute',
        bottom: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(30, 58, 138, 0.2)', // Blueish glow
        transform: [{ scale: 1.5 }],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    newChatBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    newChatText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#11d41e',
    },
    searchContainer: {
        padding: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#11d41e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#11d41e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    navContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 999,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navTextActive: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#11d41e',
        letterSpacing: 1,
    },
    navText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: 1,
    },
});