const API_BASE_URL = "";

export interface Specialist {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  reviews_total?: number;
  location: string;
  price_per_hour: number;
  avatar_url: string;
  created_at: string;
  created_by: number;
  description: string;
}

export interface SpecialistDeletionNotice {
  id: number;
  name: string;
  specialty: string;
  deletion_reason: string;
  deleted_at?: string;
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

  fetchByID: async (id: number): Promise<Specialist> => {
    const response = await fetch(`${API_BASE_URL}/api/specialists/${id}`);    if (response.status === 410) {
      const result: any = await response.json();
      throw new Error(result.message || 'Это объявление было удалено администратором');
    }    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении специалистов: ${response.status}`);
    }
    const result: ApiResponse<Specialist> = await response.json();

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
  },

  getMySpecialists: async (): Promise<Specialist[]> => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) throw new Error('UNAUTHORIZED');

    const response = await fetch(`${API_BASE_URL}/api/specialists/my/list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки ваших объявлений: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  },

  deleteById: async (id: number, accessToken: string, reason?: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/specialists/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      // Пытаемся вытащить понятное сообщение об ошибке с бэкенда
      try {
        const json: ApiResponse<null> = await response.json();
        throw new Error(json.message || `Ошибка HTTP при удалении специалиста: ${response.status}`);
      } catch {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Ошибка HTTP при удалении специалиста: ${response.status}`);
      }
    }

    const result: ApiResponse<null> = await response.json().catch(() => ({ success: true }));
    if (result.success === false) {
      throw new Error(result.message || 'Не удалось удалить специалиста');
    }
  },

  getMyDeletionNotices: async (): Promise<SpecialistDeletionNotice[]> => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/api/specialists/my/deletion-notices`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении уведомлений: ${response.status}`);
    }

    const result: ApiResponse<SpecialistDeletionNotice[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Не удалось получить уведомления');
    }

    return result.data || [];
  },

  acknowledgeDeletionNotice: async (id: number): Promise<void> => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch(`${API_BASE_URL}/api/specialists/my/deletion-notices/${id}/ack`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      throw new Error(`Ошибка HTTP при подтверждении уведомления: ${response.status}`);
    }

    const result: ApiResponse<null> = await response.json().catch(() => ({ success: true }));
    if (result.success === false) {
      throw new Error(result.message || 'Не удалось подтвердить уведомление');
    }
  },
};

export const specialistUtils = {
  getTopRated: (specialists: Specialist[], limit = 4): Specialist[] => {
    return [...specialists]
      .sort((a, b) => b.rating - a.rating || b.experience - a.experience)
      .slice(0, limit);
  }
};