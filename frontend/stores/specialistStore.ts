// stores/specialistStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Specialist {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  location: string;
  price_per_hour: number;
  created_at: string;
}

interface SpecialistState {
  specialists: Specialist[];
  loading: boolean;
  error: string | null;
  fetchSpecialists: () => Promise<void>;
  clearError: () => void;
  setSpecialists: (specialists: Specialist[]) => void;
}

const API_BASE_URL = "";

export const useSpecialistStore = create<SpecialistState>()(
  persist(
    (set, get) => ({
      specialists: [],
      loading: false,
      error: null,

      fetchSpecialists: async () => {
        try {
          set({ loading: true, error: null });

          const response = await fetch(`${API_BASE_URL}/api/specialists`);

          if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success && result.data) {
            set({ specialists: result.data, loading: false });
          } else {
            throw new Error(result.message || "Ошибка формата данных");
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Произошла ошибка";
          set({ error: errorMessage, loading: false });
          console.error("Ошибка при загрузке специалистов:", err);
        }
      },

      clearError: () => set({ error: null }),

      setSpecialists: (specialists: Specialist[]) => set({ specialists }),
    }),
    {
      name: 'specialist-storage',
      partialize: (state) => ({ specialists: state.specialists }),
    }
  )
);