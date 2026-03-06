import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Switch,
    Image,
    Alert,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { createAnimal, AnimalType, Gender } from '../../services/animals';

const PRIMARY = '#11d41e';
const BG_DARK = '#0a0f0a';
const GLASS_BG = 'rgba(255,255,255,0.03)';
const GLASS_BORDER = 'rgba(255,255,255,0.1)';
const SLATE_400 = 'rgba(148,163,184,1)';
const SLATE_500 = 'rgba(100,116,139,1)';

const GlassPanel = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.glassPanel, style]}>{children}</View>
);

const SectionLabel = ({ text }: { text: string }) => (
    <Text style={styles.sectionLabel}>{text}</Text>
);

const FieldLabel = ({ text }: { text: string }) => (
    <Text style={styles.fieldLabel}>{text}</Text>
);

// Map display labels to backend AnimalType enum values
const ANIMAL_TYPES: { label: string; value: AnimalType }[] = [
    { label: 'Bovine',  value: 'COW'   },
    { label: 'Caprine', value: 'GOAT'  },
    { label: 'Ovine',   value: 'SHEEP' },
    { label: 'Porcine', value: 'PIG'   },
];

export default function RegisterAnimal() {
    const router = useRouter();

    // Form state
    const [sex, setSex] = useState<'male' | 'female'>('male');
    const [recommendable, setRecommendable] = useState(true);
    const [animalType, setAnimalType] = useState<{ label: string; value: AnimalType }>(ANIMAL_TYPES[0]);
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [motherId, setMotherId] = useState('');
    const [fatherId, setFatherId] = useState('');
    const [typeOpen, setTypeOpen] = useState(false);

    // Photo state
    const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);

    // Submission state
    const [loading, setLoading] = useState(false);

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const uri = asset.uri;
            const name = uri.split('/').pop() ?? 'photo.jpg';
            const type = asset.mimeType ?? 'image/jpeg';
            setPhoto({ uri, name, type });
        }
    };

    const handleSubmit = async () => {
        if (!animalType) {
            Alert.alert('Validation', 'Please select an animal type.');
            return;
        }

        setLoading(true);
        try {
            await createAnimal(
                {
                    name:             name.trim() || undefined,
                    sex:              sex.toUpperCase() as Gender,
                    type:             animalType.value,
                    specie:           breed.trim() || undefined,
                    birthDate:        birthDate.trim() || undefined,
                    motherId:         motherId.trim() || undefined,
                    fatherId:         fatherId.trim() || undefined,
                },
                photo ?? undefined,
            );
            Alert.alert('Success', 'Animal registered successfully!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error: any) {
            const message = error.response?.data?.message ?? error.message ?? 'Failed to register animal.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Top App Bar */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Register Animal</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Image Upload */}
                <View style={styles.imageUploadSection}>
                    <TouchableOpacity style={styles.imageUploadContainer} activeOpacity={0.8} onPress={pickPhoto}>
                        {photo ? (
                            <Image source={{ uri: photo.uri }} style={styles.uploadBgImage} resizeMode="cover" />
                        ) : (
                            <>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCozaLQJDZMN9UfbIAH5Z597AhuE0ktreCsjtdga0qa54x6efWM9jA7qJyQrlG5adL067GC6tT6PpfKaBVAjhogkR0kzjKKyqdnHG9D3RopghhejaY98HfYHNHitJv-471pPtOuNAfd9O9Y-YYvZneBYygx7BsRmIAyNvsPFt81E6729vFEXRvkQcl8tZTtc-buR8RnIczDe5z3rJqfmkLytnOXxQii0lGGR9Y5ZfjRKIym2_zd8JOuCas9_QfFFM4tOmqR2gYJG2U' }}
                                    style={[styles.uploadBgImage, { opacity: 0.35 }]}
                                    resizeMode="cover"
                                />
                                <View style={styles.uploadOverlay} />
                            </>
                        )}
                        <View style={styles.uploadIconArea}>
                            <MaterialIcons name="add-a-photo" size={40} color={PRIMARY} />
                            <Text style={styles.uploadText}>{photo ? 'Change Photo' : 'Add Animal Photo'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Form Container */}
                <View style={styles.formContainer}>
                    <GlassPanel>
                        {/* Section: Basic Identity */}
                        <SectionLabel text="BASIC IDENTITY" />
                        <View style={styles.sectionContent}>
                            {/* Name */}
                            <View style={styles.fieldGroup}>
                                <FieldLabel text="Name (Optional)" />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Bessie"
                                    placeholderTextColor={SLATE_500}
                                    value={name}
                                    onChangeText={setName}
                                    selectionColor={PRIMARY}
                                />
                            </View>

                            {/* Type & Sex Row */}
                            <View style={styles.twoColumnRow}>
                                {/* Type Picker */}
                                <View style={styles.halfField}>
                                    <FieldLabel text="Type" />
                                    <TouchableOpacity
                                        style={styles.selectInput}
                                        onPress={() => setTypeOpen(!typeOpen)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.selectText}>{animalType.label}</Text>
                                        <MaterialIcons name="keyboard-arrow-down" size={20} color={SLATE_400} />
                                    </TouchableOpacity>
                                    {typeOpen && (
                                        <View style={styles.dropdown}>
                                            {ANIMAL_TYPES.map((t) => (
                                                <TouchableOpacity
                                                    key={t.value}
                                                    style={[
                                                        styles.dropdownItem,
                                                        animalType.value === t.value && styles.dropdownItemActive,
                                                    ]}
                                                    onPress={() => {
                                                        setAnimalType(t);
                                                        setTypeOpen(false);
                                                    }}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.dropdownItemText,
                                                            animalType.value === t.value && styles.dropdownItemTextActive,
                                                        ]}
                                                    >
                                                        {t.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {/* Sex Toggle */}
                                <View style={styles.halfField}>
                                    <FieldLabel text="Sex" />
                                    <View style={styles.sexToggle}>
                                        <TouchableOpacity
                                            style={[styles.sexBtn, sex === 'male' && styles.sexBtnActive]}
                                            onPress={() => setSex('male')}
                                        >
                                            <Text style={[styles.sexBtnText, sex === 'male' && styles.sexBtnTextActive]}>
                                                Male
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.sexBtn, sex === 'female' && styles.sexBtnActive]}
                                            onPress={() => setSex('female')}
                                        >
                                            <Text style={[styles.sexBtnText, sex === 'female' && styles.sexBtnTextActive]}>
                                                Female
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Section: Genetic Metadata */}
                        <View style={styles.sectionRow}>
                            <Text style={styles.sectionLabel}>GENETIC METADATA</Text>
                            <View style={styles.confidenceBadge}>
                                <MaterialIcons name="verified" size={12} color={PRIMARY} />
                                <Text style={styles.confidenceText}>98% Confidence</Text>
                            </View>
                        </View>
                        <View style={styles.sectionContent}>
                            {/* Breed Search */}
                            <View style={styles.fieldGroup}>
                                <FieldLabel text="Specie / Breed" />
                                <View style={styles.searchInputWrapper}>
                                    <MaterialIcons name="search" size={20} color={SLATE_500} style={styles.searchIcon} />
                                    <TextInput
                                        style={[styles.textInput, styles.searchTextInput]}
                                        placeholder="Search Breed (e.g. Holstein)"
                                        placeholderTextColor={SLATE_500}
                                        value={breed}
                                        onChangeText={setBreed}
                                        selectionColor={PRIMARY}
                                    />
                                </View>
                            </View>

                            {/* Birth Date */}
                            <View style={styles.fieldGroup}>
                                <FieldLabel text="Birth Date" />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={SLATE_500}
                                    value={birthDate}
                                    onChangeText={setBirthDate}
                                    selectionColor={PRIMARY}
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Section: Lineage */}
                        <SectionLabel text="LINEAGE" />
                        <View style={[styles.sectionContent, { gap: 10 }]}>
                            {/* Mother */}
                            <View style={styles.fieldGroup}>
                                <FieldLabel text="Mother ID (Optional)" />
                                <View style={styles.lineageRow}>
                                    <View style={[styles.lineageIconBox, { backgroundColor: 'rgba(17,212,30,0.15)' }]}>
                                        <MaterialCommunityIcons name="gender-female" size={20} color={PRIMARY} />
                                    </View>
                                    <TextInput
                                        style={styles.lineageInput}
                                        placeholder="Paste Dam animal ID"
                                        placeholderTextColor={SLATE_500}
                                        value={motherId}
                                        onChangeText={setMotherId}
                                        selectionColor={PRIMARY}
                                    />
                                </View>
                            </View>

                            {/* Father */}
                            <View style={styles.fieldGroup}>
                                <FieldLabel text="Father ID (Optional)" />
                                <View style={styles.lineageRow}>
                                    <View style={[styles.lineageIconBox, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                                        <MaterialCommunityIcons name="gender-male" size={20} color="#60a5fa" />
                                    </View>
                                    <TextInput
                                        style={styles.lineageInput}
                                        placeholder="Paste Sire animal ID"
                                        placeholderTextColor={SLATE_500}
                                        value={fatherId}
                                        onChangeText={setFatherId}
                                        selectionColor={PRIMARY}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Recommendable Toggle */}
                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.toggleTitle}>Recommendable</Text>
                                <Text style={styles.toggleSub}>Available for breeding programs</Text>
                            </View>
                            <Switch
                                value={recommendable}
                                onValueChange={setRecommendable}
                                trackColor={{ false: '#374151', true: PRIMARY }}
                                thumbColor="#fff"
                            />
                        </View>
                    </GlassPanel>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                        activeOpacity={0.85}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#081209" />
                        ) : (
                            <>
                                <MaterialIcons name="app-registration" size={22} color="#081209" />
                                <Text style={styles.registerBtnText}>Complete Registration</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        By registering, you confirm that all biological and lineage information provided is accurate and verifiable.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Accent Bar */}
            <View style={styles.bottomAccent} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_DARK,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        marginLeft: 16,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageUploadSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    imageUploadContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(17,212,30,0.3)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: GLASS_BG,
    },
    uploadBgImage: {
        ...StyleSheet.absoluteFillObject,
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,15,10,0.4)',
    },
    uploadIconArea: {
        alignItems: 'center',
        gap: 8,
        zIndex: 2,
    },
    uploadText: {
        color: PRIMARY,
        fontSize: 14,
        fontWeight: '600',
    },
    formContainer: {
        paddingHorizontal: 24,
        gap: 16,
    },
    glassPanel: {
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 16,
        padding: 20,
        gap: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: PRIMARY,
        textTransform: 'uppercase',
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(17,212,30,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    confidenceText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: PRIMARY,
    },
    sectionContent: {
        gap: 14,
    },
    fieldGroup: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: SLATE_400,
        marginLeft: 4,
    },
    textInput: {
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        color: '#fff',
        fontSize: 14,
    },
    searchInputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: 14,
        zIndex: 1,
    },
    searchTextInput: {
        flex: 1,
        paddingLeft: 42,
    },
    twoColumnRow: {
        flexDirection: 'row',
        gap: 14,
    },
    halfField: {
        flex: 1,
        gap: 6,
        position: 'relative',
    },
    selectInput: {
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: {
        color: '#fff',
        fontSize: 14,
    },
    dropdown: {
        position: 'absolute',
        top: 76,
        left: 0,
        right: 0,
        backgroundColor: '#111a11',
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        borderRadius: 12,
        zIndex: 100,
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    dropdownItemActive: {
        backgroundColor: 'rgba(17,212,30,0.1)',
    },
    dropdownItemText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    dropdownItemTextActive: {
        color: PRIMARY,
        fontWeight: '600',
    },
    sexToggle: {
        height: 48,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    sexBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    sexBtnActive: {
        backgroundColor: PRIMARY,
    },
    sexBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: SLATE_400,
        textTransform: 'uppercase',
    },
    sexBtnTextActive: {
        color: '#081209',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    lineageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 4,
        paddingRight: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    lineageIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    lineageInput: {
        flex: 1,
        height: 40,
        color: '#fff',
        fontSize: 14,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4,
    },
    toggleTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    toggleSub: {
        fontSize: 12,
        color: SLATE_500,
        marginTop: 2,
    },
    registerBtn: {
        height: 56,
        backgroundColor: PRIMARY,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 8,
    },
    registerBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#081209',
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: 11,
        color: SLATE_500,
        paddingHorizontal: 20,
        lineHeight: 16,
        paddingBottom: 20,
    },
    bottomAccent: {
        height: 6,
        backgroundColor: 'rgba(17,212,30,0.2)',
        borderTopLeftRadius: 999,
        borderTopRightRadius: 999,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
});
