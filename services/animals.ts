import api from './api';

export type AnimalType = 'COW' | 'PIG' | 'SHEEP' | 'GOAT';
export type Gender = 'MALE' | 'FEMALE';

export interface CreateAnimalData {
  name?: string;
  sex: Gender;
  birthDate?: string;
  type: AnimalType;
  status?: string;
  motherId?: string;
  fatherId?: string;
  specie?: string;
  breed_confidence?: number;
}

export interface Animal {
  animalId: string;
  name?: string;
  sex: Gender;
  birthDate?: string;
  type: AnimalType;
  profilePhoto?: string;
  status?: string;
  motherId?: string;
  fatherId?: string;
  ownerId: string;
  specie?: string;
  breed_confidence?: number;
  recommendable: boolean;
  createdAt?: string;
}

export const createAnimal = async (
  data: CreateAnimalData,
  photo?: { uri: string; name: string; type: string },
): Promise<Animal> => {
  const formData = new FormData();

  (Object.entries(data) as [string, any][]).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });

  if (photo) {
    formData.append('photo', { uri: photo.uri, name: photo.name, type: photo.type } as any);
  }

  const response = await api.post<Animal>('/animals', formData, {
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
