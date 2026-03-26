import React, { useState, useEffect, useRef } from 'react';
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
    Modal,
    Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { createAnimal, AnimalType, Gender, AnimalSpecies, SPECIES_BY_TYPE } from '../../services/animals';
import { useMLModel } from '../../hooks/useMLModel.native';

// Metro needs a static require() at module level to bundle the .tflite asset
const MODEL_ASSET = require('../../assets/models/livestock_mobile_vnet_final.tflite');

// Labels in the same order as model training output
const BREED_LABELS = [
    'brown_swiss_cow', 'dorper_sheep', 'duroc_pig', 'fresian_cow', 'girolando_cow',
    'indigenous_ankole_cow', 'indigenous_goat', 'indigenous_pig', 'jersey_cow',
    'landrace_pig', 'large_white_pig', 'merino_sheep', 'pietrain_pig', 'sahiwal_cow',
] as const;
type BreedLabel = typeof BREED_LABELS[number];

// Map model output labels to AnimalSpecies + AnimalType
const LABEL_MAP: Record<BreedLabel, { species: AnimalSpecies; type: AnimalType }> = {
    brown_swiss_cow:       { species: 'BROWN_SWISS_COW',  type: 'COW'   },
    dorper_sheep:          { species: 'MERINO_SHEEP',      type: 'SHEEP' }, // closest in schema
    duroc_pig:             { species: 'DUROC_PIG',         type: 'PIG'   },
    fresian_cow:           { species: 'FREISIAN_COW',      type: 'COW'   },
    girolando_cow:         { species: 'GIROLANDO_COW',     type: 'COW'   },
    indigenous_ankole_cow: { species: 'ANKOLE_COW',        type: 'COW'   },
    indigenous_goat:       { species: 'LOCAL_GOAT',        type: 'GOAT'  },
    indigenous_pig:        { species: 'DUROC_PIG',         type: 'PIG'   },
    jersey_cow:            { species: 'JERSEY_COW',        type: 'COW'   },
    landrace_pig:          { species: 'LARGE_WHITE_PIG',   type: 'PIG'   },
    large_white_pig:       { species: 'LARGE_WHITE_PIG',   type: 'PIG'   },
    merino_sheep:          { species: 'MERINO_SHEEP',      type: 'SHEEP' },
    pietrain_pig:          { species: 'LARGE_WHITE_PIG',   type: 'PIG'   },
    sahiwal_cow:           { species: 'HOLSTEIN_COW',      type: 'COW'   }, // closest in schema
};

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

const ANIMAL_TYPES: { label: string; value: AnimalType }[] = [
    { label: 'Cow',   value: 'COW'   },
    { label: 'Goat',  value: 'GOAT'  },
    { label: 'Sheep', value: 'SHEEP' },
    { label: 'Pig',   value: 'PIG'   },
];

// Gender-specific breeding age windows (months) — used to auto-set recommendable
const BREEDING_AGE: Record<AnimalType, { female: { min: number; max: number }; male: { min: number; max: number } }> = {
    COW:   { female: { min: 15, max: 18 }, male: { min: 12, max: 15 } },
    PIG:   { female: { min: 7,  max: 8  }, male: { min: 8,  max: 10 } },
    SHEEP: { female: { min: 10, max: 12 }, male: { min: 5,  max: 7  } },
    GOAT:  { female: { min: 10, max: 12 }, male: { min: 6,  max: 8  } },
};

function calcAge(dateStr: string): { totalMonths: number; label: string } | null {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const totalMonths =
        (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (totalMonths < 0) return null;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    const label = y > 0 ? `${y}y${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
    return { totalMonths, label };
}

export default function RegisterAnimal() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        initialType?: string;
        initialSpecies?: string;
        initialImage?: string;
        initialConfidence?: string;
    }>();

    // Resolve initial type/species from scanner params (if coming from breed-camera flow)
    const initialTypeOption = ANIMAL_TYPES.find(t => t.value === params.initialType) ?? ANIMAL_TYPES[0];
    const initialSpeciesOptions = SPECIES_BY_TYPE[initialTypeOption.value];
    const initialSpeciesOption = initialSpeciesOptions.find(s => s.value === params.initialSpecies)
        ?? initialSpeciesOptions[0];
    const fromScanner = !!(params.initialType && params.initialSpecies);

    // Form state
    const [sex, setSex] = useState<'male' | 'female'>('male');
    const [recommendable, setRecommendable] = useState(true);
    const [animalType, setAnimalType] = useState<{ label: string; value: AnimalType }>(initialTypeOption);
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [motherId, setMotherId] = useState('');
    const [fatherId, setFatherId] = useState('');
    const [typeOpen, setTypeOpen] = useState(false);

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerDate, setPickerDate] = useState<Date>(new Date());

    const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
        // Android: dismiss on any event; iOS: keep open until user taps Done
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (event.type === 'set' && selected) {
            setPickerDate(selected);
            const iso = selected.toISOString().split('T')[0]; // YYYY-MM-DD
            setBirthDate(iso);
        }
    };

    const formatDisplayDate = (iso: string) => {
        if (!iso) return null;
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Species — filtered list resets when animal type changes
    const speciesOptions = SPECIES_BY_TYPE[animalType.value];
    const [species, setSpecies] = useState<{ label: string; value: AnimalSpecies }>(initialSpeciesOption);
    const [speciesOpen, setSpeciesOpen] = useState(false);

    // Photo state — pre-fill from scanner if available
    const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(
        params.initialImage && params.initialImage.startsWith('file')
            ? { uri: params.initialImage, name: 'scan-image.jpg', type: 'image/jpeg' }
            : null,
    );

    // Breed classifier (model loads on mount; Expo Go will fail gracefully)
    const { runInferenceWithRetry, isReady: modelReady } = useMLModel(MODEL_ASSET);
    const [scanning, setScanning] = useState(false);
    const [breedConfidence, setBreedConfidence] = useState(
        fromScanner && params.initialConfidence
            ? parseFloat(params.initialConfidence) / 100
            : 1.0,
    );
    // true once the model has successfully classified a photo (or came from scanner)
    const [inferredByModel, setInferredByModel] = useState(fromScanner);
    // true when the user explicitly wants to override the AI result
    const [speciesOverridden, setSpeciesOverridden] = useState(false);
    // URI waiting to be inferred once model becomes ready
    const pendingUriRef = useRef<string | null>(null);

    const runBreedInference = async (uri: string) => {
        setScanning(true);
        try {
            const { embedding: logits } = await runInferenceWithRetry(uri);
            console.log(`[BreedDetect] Output dim: ${logits.length}, expected: ${BREED_LABELS.length}`);

            if (logits.length !== BREED_LABELS.length) {
                console.warn(`[BreedDetect] Model output dim (${logits.length}) ≠ BREED_LABELS (${BREED_LABELS.length}). Cannot classify breed.`);
            } else {
                let maxLogit = -Infinity;
                for (let i = 0; i < logits.length; i++) if (logits[i] > maxLogit) maxLogit = logits[i];
                const exps = Array.from(logits).map(l => Math.exp(l - maxLogit));
                const sumExp = exps.reduce((a, b) => a + b, 0);
                let maxProb = -Infinity, maxIndex = 0;
                for (let i = 0; i < exps.length; i++) {
                    const p = exps[i] / sumExp;
                    if (p > maxProb) { maxProb = p; maxIndex = i; }
                }
                const rawLabel = BREED_LABELS[maxIndex] as BreedLabel;
                console.log(`[BreedDetect] Top label: ${rawLabel} (${(maxProb * 100).toFixed(1)}%)`);
                const mapped = LABEL_MAP[rawLabel];
                if (mapped) {
                    const newType = ANIMAL_TYPES.find(t => t.value === mapped.type)!;
                    const newSpecies = SPECIES_BY_TYPE[mapped.type].find(s => s.value === mapped.species)
                        ?? SPECIES_BY_TYPE[mapped.type][0];
                    setAnimalType(newType);
                    setSpecies(newSpecies);
                    setBreedConfidence(maxProb);
                    setInferredByModel(true);
                    setSpeciesOverridden(false);
                }
            }
        } catch (e) {
            console.warn('[BreedDetect] Inference failed:', e);
        } finally {
            setScanning(false);
        }
    };

    // If a photo was picked before the model finished loading, run inference now
    useEffect(() => {
        if (modelReady && pendingUriRef.current) {
            const uri = pendingUriRef.current;
            pendingUriRef.current = null;
            runBreedInference(uri);
        }
    }, [modelReady]);

    // Age & auto-recommendable (derived from birthDate, animalType, and sex)
    const ageInfo = birthDate.trim() ? calcAge(birthDate.trim()) : null;
    const breedingRange = BREEDING_AGE[animalType.value]?.[sex as 'female' | 'male'] ?? null;
    const autoRecommendable: boolean | null = ageInfo && breedingRange
        ? ageInfo.totalMonths >= breedingRange.min
        : null; // null = no birth date → use manual toggle

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
            const photoName = uri.split('/').pop() ?? 'photo.jpg';
            const photoType = asset.mimeType ?? 'image/jpeg';
            setPhoto({ uri, name: photoName, type: photoType });

            // Run breed inference immediately if model is ready; otherwise queue it
            if (modelReady) {
                runBreedInference(uri);
            } else {
                // Model still loading — store URI and inference will run via useEffect
                pendingUriRef.current = uri;
                setScanning(true); // show spinner while waiting for model
            }
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
                    name:             name.trim(), // always send — backend @IsString() is not @IsOptional()
                    sex:              sex.toUpperCase() as Gender,
                    type:             animalType.value,
                    specie:           species.value,
                    status:           'ALIVE',
                    breed_confidence: breedConfidence,
                    birthDate:        birthDate.trim() || undefined,
                    motherId:         motherId.trim() || undefined,
                    fatherId:         fatherId.trim() || undefined,
                    // recommendable is computed server-side from type + sex + birthDate
                },
                photo ?? undefined,
            );
            Alert.alert('Success', 'Animal registered successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/my-herd' as any) },
            ]);
        } catch (error: any) {
            const status = error.response?.status ?? 'network';
            const rawData = error.response?.data;
            console.error('[RegisterAnimal] Submit failed — status:', status);
            console.error('[RegisterAnimal] Server response:', JSON.stringify(rawData, null, 2));
            const msgs = Array.isArray(rawData?.message)
                ? rawData.message
                : rawData?.message
                    ? [rawData.message]
                    : [];
            const detail = msgs.length ? msgs.join('\n') : (error.message ?? 'Failed to register animal.');
            Alert.alert(
                `Error (${status})`,
                detail,
                [{ text: 'OK' }],
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Top App Bar */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.navigate('/(tabs)/home' as any)}>
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
                            {scanning ? (
                                <>
                                    <ActivityIndicator size="large" color={PRIMARY} />
                                    <Text style={styles.uploadText}>Detecting breed...</Text>
                                </>
                            ) : (
                                <>
                                    <MaterialIcons name="add-a-photo" size={40} color={PRIMARY} />
                                    <Text style={styles.uploadText}>{photo ? 'Change Photo' : 'Add Animal Photo'}</Text>
                                </>
                            )}
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
                                                        setSpecies(SPECIES_BY_TYPE[t.value][0]);
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
                            {inferredByModel && !speciesOverridden && !scanning && (
                                <View style={styles.confidenceBadge}>
                                    <MaterialIcons name="verified" size={12} color={PRIMARY} />
                                    <Text style={styles.confidenceText}>AI Detected</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.sectionContent}>
                            {/* Species — AI badge or manual dropdown */}
                            <View style={[styles.fieldGroup, { zIndex: 10 }]}>
                                <FieldLabel text="Specie / Breed" />

                                {/* Scanning placeholder */}
                                {scanning && (
                                    <View style={styles.aiBadge}>
                                        <ActivityIndicator size="small" color={PRIMARY} />
                                        <Text style={styles.aiBadgeText}>Detecting breed from photo...</Text>
                                    </View>
                                )}

                                {/* AI result badge (photo uploaded + model ran + not overridden) */}
                                {!scanning && inferredByModel && !speciesOverridden && (
                                    <View style={styles.aiResultRow}>
                                        <View style={styles.aiBadge}>
                                            <MaterialIcons name="auto-awesome" size={14} color={PRIMARY} />
                                            <Text style={styles.aiBadgeText}>
                                                {species.label} · {(breedConfidence * 100).toFixed(0)}% confidence
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSpeciesOverridden(true);
                                                setBreedConfidence(1.0);
                                            }}
                                            style={styles.overrideBtn}
                                        >
                                            <Text style={styles.overrideBtnText}>Override</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Manual dropdown (no photo, or model didn't run, or user overrode) */}
                                {!scanning && (!inferredByModel || speciesOverridden) && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.selectInput}
                                            onPress={() => setSpeciesOpen(!speciesOpen)}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={styles.selectText}>{species.label}</Text>
                                            <MaterialIcons name="keyboard-arrow-down" size={20} color={SLATE_400} />
                                        </TouchableOpacity>
                                        {speciesOpen && (
                                            <View style={[styles.dropdown, { top: 54 }]}>
                                                {speciesOptions.map((s) => (
                                                    <TouchableOpacity
                                                        key={s.value}
                                                        style={[
                                                            styles.dropdownItem,
                                                            species.value === s.value && styles.dropdownItemActive,
                                                        ]}
                                                        onPress={() => {
                                                            setSpecies(s);
                                                            setSpeciesOpen(false);
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.dropdownItemText,
                                                                species.value === s.value && styles.dropdownItemTextActive,
                                                            ]}
                                                        >
                                                            {s.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>

                            {/* Birth Date */}
                            <View style={styles.fieldGroup}>
                                <FieldLabel text="Birth Date" />
                                <TouchableOpacity
                                    style={styles.dateBtn}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons name="calendar-today" size={18} color={birthDate ? PRIMARY : SLATE_500} />
                                    <Text style={[styles.dateBtnText, !birthDate && styles.dateBtnPlaceholder]}>
                                        {birthDate ? formatDisplayDate(birthDate) : 'Select birth date'}
                                    </Text>
                                    {birthDate && (
                                        <TouchableOpacity
                                            onPress={() => setBirthDate('')}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <MaterialIcons name="close" size={16} color={SLATE_500} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>

                                {/* Android: inline picker shown when state is true */}
                                {Platform.OS === 'android' && showDatePicker && (
                                    <DateTimePicker
                                        value={pickerDate}
                                        mode="date"
                                        display="default"
                                        maximumDate={new Date()}
                                        onChange={onDateChange}
                                    />
                                )}

                                {/* iOS: picker in a modal */}
                                {Platform.OS === 'ios' && (
                                    <Modal
                                        visible={showDatePicker}
                                        transparent
                                        animationType="slide"
                                        onRequestClose={() => setShowDatePicker(false)}
                                    >
                                        <View style={styles.dateModalOverlay}>
                                            <View style={styles.dateModalSheet}>
                                                <View style={styles.dateModalHeader}>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setShowDatePicker(false);
                                                            setBirthDate(''); // cancelled
                                                        }}
                                                    >
                                                        <Text style={styles.dateModalCancel}>Cancel</Text>
                                                    </TouchableOpacity>
                                                    <Text style={styles.dateModalTitle}>Birth Date</Text>
                                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                        <Text style={styles.dateModalDone}>Done</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <DateTimePicker
                                                    value={pickerDate}
                                                    mode="date"
                                                    display="spinner"
                                                    maximumDate={new Date()}
                                                    onChange={onDateChange}
                                                    style={styles.iosDatePicker}
                                                    textColor="#fff"
                                                />
                                            </View>
                                        </View>
                                    </Modal>
                                )}

                                {ageInfo && (
                                    <View style={styles.ageBadge}>
                                        <MaterialIcons name="cake" size={13} color={PRIMARY} />
                                        <Text style={styles.ageBadgeText}>Age: {ageInfo.label}</Text>
                                        <Text style={styles.ageBadgeSub}>
                                            · {autoRecommendable ? 'Breeding age ✓' : 'Below breeding age'}
                                        </Text>
                                    </View>
                                )}
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

                        {/* Recommendable */}
                        <View style={styles.toggleRow}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text style={styles.toggleTitle}>Recommendable</Text>
                                <Text style={styles.toggleSub}>
                                    {autoRecommendable !== null
                                        ? 'Auto-set from age — edit birth date to change'
                                        : 'Available for breeding programs'}
                                </Text>
                            </View>
                            {autoRecommendable !== null ? (
                                <View style={[
                                    styles.autoBadge,
                                    { backgroundColor: autoRecommendable ? 'rgba(17,212,30,0.1)' : 'rgba(239,68,68,0.1)' },
                                ]}>
                                    <MaterialIcons
                                        name={autoRecommendable ? 'check-circle' : 'cancel'}
                                        size={13}
                                        color={autoRecommendable ? PRIMARY : '#ef4444'}
                                    />
                                    <Text style={[styles.autoBadgeText, { color: autoRecommendable ? PRIMARY : '#ef4444' }]}>
                                        {autoRecommendable ? 'Yes' : 'No'}
                                    </Text>
                                </View>
                            ) : (
                                <Switch
                                    value={recommendable}
                                    onValueChange={setRecommendable}
                                    trackColor={{ false: '#374151', true: PRIMARY }}
                                    thumbColor="#fff"
                                />
                            )}
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
    aiResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        backgroundColor: 'rgba(17,212,30,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(17,212,30,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    aiBadgeText: {
        color: PRIMARY,
        fontSize: 13,
        fontWeight: '600',
        flexShrink: 1,
    },
    overrideBtn: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    overrideBtnText: {
        color: SLATE_400,
        fontSize: 12,
        fontWeight: '600',
    },
    ageBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        marginTop: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(17,212,30,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(17,212,30,0.15)',
        alignSelf: 'flex-start' as const,
    },
    ageBadgeText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: PRIMARY,
    },
    ageBadgeSub: {
        fontSize: 12,
        color: SLATE_400,
    },
    autoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(17,212,30,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    autoBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: PRIMARY,
    },

    // Date picker
    dateBtn: {
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateBtnText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
    },
    dateBtnPlaceholder: {
        color: SLATE_500,
    },

    // iOS date modal
    dateModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    dateModalSheet: {
        backgroundColor: '#111a11',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 32,
    },
    dateModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    dateModalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    dateModalCancel: {
        fontSize: 15,
        color: SLATE_400,
        fontWeight: '500',
    },
    dateModalDone: {
        fontSize: 15,
        color: PRIMARY,
        fontWeight: '700',
    },
    iosDatePicker: {
        height: 200,
        backgroundColor: 'transparent',
    },
});
