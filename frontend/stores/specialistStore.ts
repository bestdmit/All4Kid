import { create } from 'zustand';
import { specialistApi, type Specialist } from '../src/api/specialists';

interface SpecialistState {
  specialists: Specialist[];
  loading: boolean;
  error: string | null;
  fetchSpecialists: () => Promise<void>;
  searchSpecialists: (searchTerm?: string, category?: string) => Promise<void>;
  clearError: () => void;
  setSpecialists: (specialists: Specialist[]) => void;
  getTopRatedSpecialists: (limit?: number) => Specialist[];
  getSpecialistsById: (authId: number) => Specialist[];
}

export const useSpecialistStore = create<SpecialistState>((set, get) => ({
  specialists: [],
  loading: false,
  error: null,

  fetchSpecialists: async () => {
    try {
      set({ loading: true, error: null });
      
      const specialists = await specialistApi.fetchAll();
      set({ specialists, loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Произошла ошибка при загрузке";
      set({ error: errorMessage, loading: false });
      console.error("Ошибка при загрузке специалистов:", err);
    }
  },

  searchSpecialists: async (searchTerm?: string, category?: string) => {
    try {
      set({ loading: true, error: null });
      
      const specialists = await specialistApi.search(searchTerm, category);
      set({ specialists, loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Произошла ошибка при поиске";
      set({ error: errorMessage, loading: false });
      console.error("Ошибка при поиске специалистов:", err);
    }
  },

  clearError: () => set({ error: null }),

  setSpecialists: (specialists: Specialist[]) => set({ specialists }),

  getTopRatedSpecialists: (limit: number = 4): Specialist[] => {
    const { specialists } = get();
    const sorted = [...specialists].sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.experience - a.experience;
    });
    return sorted.slice(0, limit);
  },

  getSpecialistsById: (authId: number): Specialist[] => {
    const { specialists } = get();
    return specialists.filter(specialist => specialist.created_by === authId);
  },
}));