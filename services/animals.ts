import api from './api';

export type AnimalType = 'COW' | 'PIG' | 'SHEEP' | 'GOAT';
export type Gender = 'MALE' | 'FEMALE';
export type AnimalStatus = 'ALIVE' | 'DECEASED' | 'SOLD' | 'PREGNANT' | 'OTHER';
export type AnimalSpecies =
  | 'HOLSTEIN_COW'
  | 'FREISIAN_COW'
  | 'ANKOLE_COW'
  | 'BROWN_SWISS_COW'
  | 'GIROLANDO_COW'
  | 'JERSEY_COW'
  | 'LARGE_WHITE_PIG'
  | 'DUROC_PIG'
  | 'MERINO_SHEEP'
  | 'LOCAL_GOAT';

/** Species grouped by animal type, matching the AnimalSpecies enum */
export const SPECIES_BY_TYPE: Record<AnimalType, { label: string; value: AnimalSpecies }[]> = {
  COW: [
    { label: 'Holstein',    value: 'HOLSTEIN_COW'   },
    { label: 'Friesian',    value: 'FREISIAN_COW'   },
    { label: 'Ankole',      value: 'ANKOLE_COW'     },
    { label: 'Brown Swiss', value: 'BROWN_SWISS_COW' },
    { label: 'Girolando',   value: 'GIROLANDO_COW'  },
    { label: 'Jersey',      value: 'JERSEY_COW'     },
  ],
  PIG: [
    { label: 'Large White', value: 'LARGE_WHITE_PIG' },
    { label: 'Duroc',       value: 'DUROC_PIG'       },
  ],
  SHEEP: [
    { label: 'Merino', value: 'MERINO_SHEEP' },
  ],
  GOAT: [
    { label: 'Local Goat', value: 'LOCAL_GOAT' },
  ],
};

export interface CreateAnimalData {
  name?: string;
  sex: Gender;
  birthDate?: string;
  type: AnimalType;
  status?: AnimalStatus;
  motherId?: string;
  fatherId?: string;
  specie: AnimalSpecies;
  breed_confidence: number;
  // recommendable is computed server-side from type + sex + birthDate
}

export interface AnimalOwner {
  userId: string;
  name: string;
  phone_number: string;
  profile_url: string;
  district: string;
  sector: string;
  village: string;
  cell: string;
}

export interface Animal {
  animalId: string;
  name?: string;
  sex: Gender;
  birthDate?: string;
  type: AnimalType;
  profilePhoto?: string;
  status?: AnimalStatus;
  motherId?: string;
  fatherId?: string;
  ownerId: string;
  specie?: AnimalSpecies;
  breed_confidence?: number;
  recommendable: boolean;
  createdAt?: string;
  // Nested relations (included by backend when available)
  mother?: Animal | null;
  father?: Animal | null;
  owner?: AnimalOwner | null;
}

/** Returns the human-readable label for an AnimalSpecies enum value */
export const getSpeciesLabel = (species?: AnimalSpecies | string): string => {
  if (!species) return 'Unknown';
  for (const list of Object.values(SPECIES_BY_TYPE)) {
    const found = list.find(s => s.value === species);
    if (found) return found.label;
  }
  return String(species).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export const createAnimal = async (
  data: CreateAnimalData,
  photo?: { uri: string; name: string; type: string },
): Promise<Animal> => {
  // Sanitise optional date — NestJS rejects non-ISO strings on DateTime? fields
  const cleanData = { ...data };
  if (cleanData.birthDate) {
    const d = new Date(cleanData.birthDate);
    if (isNaN(d.getTime())) {
      delete cleanData.birthDate;
    } else {
      cleanData.birthDate = d.toISOString();
    }
  }
  // Strip empty lineage IDs — sending an empty string causes FK lookup to fail
  if (!cleanData.motherId?.trim()) delete cleanData.motherId;
  if (!cleanData.fatherId?.trim()) delete cleanData.fatherId;

  // Step 1: POST with JSON so NestJS receives properly typed values (no multipart coercion).
  // recommendable is NOT sent: the server computes it from type + sex + birthDate.
  const response = await api.post<Animal>('/animals', cleanData);
  const created = response.data;

  // Step 2: upload the photo via the dedicated PATCH endpoint if one was selected.
  if (photo) {
    try {
      await uploadAnimalPhoto(created.animalId, photo);
    } catch (photoErr) {
      console.warn('[animals] Photo upload failed after create:', photoErr);
      // Animal was created successfully — don't throw; just return without photo.
    }
  }
  return created;
};

export const uploadAnimalPhoto = async (
  animalId: string,
  photo: { uri: string; name: string; type: string },
): Promise<Animal> => {
  const formData = new FormData();
  formData.append('photo', { uri: photo.uri, name: photo.name, type: photo.type } as any);
  const response = await api.patch<Animal>(`/animals/${animalId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAllAnimals = async (): Promise<Animal[]> => {
  const response = await api.get<Animal[]>('/animals');
  return response.data;
};

export const getAnimal = async (id: string): Promise<Animal> => {
  const response = await api.get<Animal>(`/animals/${id}`);
  return response.data;
};
