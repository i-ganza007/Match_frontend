import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassView } from './GlassView';

interface ChatInputProps {
    onSend: (message: string) => void;
}

import { useTheme } from '../context/ThemeContext';

export const ChatInput = ({ onSend }: ChatInputProps) => {
    const [text, setText] = React.useState('');
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    const handleSend = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <GlassView style={[styles.container, { backgroundColor: colors.glassBackground }]} bright>
            <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons name="add-circle-outline" size={24} color={colors.icon} />
            </TouchableOpacity>

            <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Type a message..."
                placeholderTextColor={colors.icon}
                value={text}
                onChangeText={setText}
                multiline
            />

            <TouchableOpacity
                style={[styles.sendButton, text.trim() ? styles.sendButtonActive : { backgroundColor: colors.glassBorder }]}
                onPress={handleSend}
                activeOpacity={0.8}
            >
                <MaterialIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
        </GlassView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end', // Aligns items to bottom so multiline input grows up
        padding: 8,
        borderRadius: 24,
    },
    iconButton: {
        padding: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 10,
        paddingHorizontal: 8,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2, // Alignment fix
    },
    sendButtonActive: {
        backgroundColor: '#11d41e',
        shadowColor: '#11d41e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    }
});