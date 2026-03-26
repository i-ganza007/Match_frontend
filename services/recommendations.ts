import api from './api';
import { Animal } from './animals';

const RECS_LOG_PREFIX = '[RecsAPI]';

export interface BreedingRec {
  breedingRecId: string;
  animalInitial: string;
  recommendedAnimalId: string;
  overall_score: number;                  // 0–1
  genetic_diversity_score: number;        // 0–1
  inbreeding_risk_score: number;          // 0–1  (lower = safer)
  breed_composition_match_score: number;  // 0–1
  user_accepted: boolean;
  locked: boolean;
  generatedAt: string;
  acceptedAt: string | null;
  userFeedback: string | null;
  recommendedAnimal: Animal;
}

export const getRecommendations = async (animalId: string): Promise<BreedingRec[]> => {
  const startedAt = Date.now();
  console.log(`${RECS_LOG_PREFIX} GET /recommendations start`, { animalId });
  try {
    const response = await api.get<BreedingRec[]>('/recommendations', {
      params: { animalId },
      timeout: 120000, // ML scoring + possible Render cold-start can take up to 2 min
    });
    const recs = response.data ?? [];
    console.log(`${RECS_LOG_PREFIX} GET /recommendations success`, {
      animalId,
      status: response.status,
      count: recs.length,
      durationMs: Date.now() - startedAt,
      topRecommendationIds: recs.slice(0, 3).map(r => r.recommendedAnimalId),
    });
    return recs;
  } catch (error: any) {
    console.warn(`${RECS_LOG_PREFIX} GET /recommendations failed`, {
      animalId,
      durationMs: Date.now() - startedAt,
      status: error?.response?.status,
      message: error?.response?.data?.message ?? error?.message,
      data: error?.response?.data,
    });
    throw error;
  }
};

export const acceptRecommendation = async (recId: string): Promise<BreedingRec> => {
  const startedAt = Date.now();
  console.log(`${RECS_LOG_PREFIX} PATCH /recommendations/:id/accept start`, { recId });
  try {
    const response = await api.patch<BreedingRec>(`/recommendations/${recId}/accept`);
    console.log(`${RECS_LOG_PREFIX} PATCH /recommendations/:id/accept success`, {
      recId,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });
    return response.data;
  } catch (error: any) {
    console.warn(`${RECS_LOG_PREFIX} PATCH /recommendations/:id/accept failed`, {
      recId,
      durationMs: Date.now() - startedAt,
      status: error?.response?.status,
      message: error?.response?.data?.message ?? error?.message,
      data: error?.response?.data,
    });
    throw error;
  }
};

// ── Quick Matches ─────────────────────────────────────────────────────────────

export interface QuickMatchAnimal {
  animalId: string;
  name: string;
  type: string;
  specie: string;
  sex: string;
  profilePhoto: string | null;
}

export interface QuickMatchOwner {
  userId: string;
  name: string;
  phone_number: string;
  profile_url: string | null;
  district: string;
  latitude: number;
  longitude: number;
  distance_km: number;
}

export interface QuickMatchScores {
  overall_score: number;
  genetic_diversity_score: number;
  inbreeding_risk_score: number;
  breed_composition_match_score: number;
}

export interface QuickMatch {
  animal: QuickMatchAnimal;
  owner: QuickMatchOwner;
  scores: QuickMatchScores;
}

export interface QuickMatchGroup {
  yourAnimal: QuickMatchAnimal;
  matches: QuickMatch[];
}

export const getQuickMatches = async (
  latitude: number,
  longitude: number,
  radius: 5 | 10 | 15,
): Promise<QuickMatchGroup[]> => {
  const startedAt = Date.now();
  console.log(`${RECS_LOG_PREFIX} GET /recommendations/quick-matches start`, { latitude, longitude, radius });
  try {
    const response = await api.get<QuickMatchGroup[]>('/recommendations/quick-matches', {
      params: { latitude, longitude, radius },
      timeout: 120000,
    });
    const data = response.data ?? [];
    console.log(`${RECS_LOG_PREFIX} GET /recommendations/quick-matches success`, {
      status: response.status,
      groups: data.length,
      totalMatches: data.reduce((s, g) => s + g.matches.length, 0),
      durationMs: Date.now() - startedAt,
    });
    return data;
  } catch (error: any) {
    console.warn(`${RECS_LOG_PREFIX} GET /recommendations/quick-matches failed`, {
      durationMs: Date.now() - startedAt,
      status: error?.response?.status,
      message: error?.response?.data?.message ?? error?.message,
    });
    throw error;
  }
};

export const submitFeedback = async (
  recId: string,
  feedback: string,
): Promise<BreedingRec> => {
  const startedAt = Date.now();
  console.log(`${RECS_LOG_PREFIX} PATCH /recommendations/:id feedback start`, {
    recId,
    feedbackLength: feedback.length,
  });
  try {
    const response = await api.patch<BreedingRec>(`/recommendations/${recId}`, {
      userFeedback: feedback,
    });
    console.log(`${RECS_LOG_PREFIX} PATCH /recommendations/:id feedback success`, {
      recId,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });
    return response.data;
  } catch (error: any) {
    console.warn(`${RECS_LOG_PREFIX} PATCH /recommendations/:id feedback failed`, {
      recId,
      durationMs: Date.now() - startedAt,
      status: error?.response?.status,
      message: error?.response?.data?.message ?? error?.message,
      data: error?.response?.data,
    });
    throw error;
  }
};
