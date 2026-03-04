const API_BASE_URL = "";

export interface Specialist {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  location: string;
  price_per_hour: number;
  created_at: string;
  created_by: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const specialistApi = {
  fetchAll: async (): Promise<Specialist[]> => {
    const response = await fetch(`${API_BASE_URL}/api/specialists`);
    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении специалистов: ${response.status}`);
    }
    const result: ApiResponse<Specialist[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || "Ошибка формата данных");
    }

    return result.data;
  },

  search: async (searchTerm?: string, category?: string): Promise<Specialist[]> => {
    const params = new URLSearchParams();
    if (searchTerm?.trim()) params.append('search', searchTerm.trim());
    if (category) params.append('category', category);
    
    const url = `${API_BASE_URL}/api/specialists${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Ошибка HTTP при поиске специалистов: ${response.status}`);
    }
    
    const result: ApiResponse<Specialist[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || "Ошибка формата данных при поиске");
    }
    
    return result.data || [];
  },

  fetchByAuthorId: async (authId: number): Promise<Specialist[]> => {
    const all = await specialistApi.fetchAll();
    return all.filter(s => s.created_by === authId);
  }
};

export const specialistUtils = {
  getTopRated: (specialists: Specialist[], limit = 4): Specialist[] => {
    return [...specialists]
      .sort((a, b) => b.rating - a.rating || b.experience - a.experience)
      .slice(0, limit);
  }
};