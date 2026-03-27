import type { Specialist } from './specialists';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
}

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const json = await response.json();
    if (typeof json?.message === 'string' && json.message.trim()) {
      return json.message;
    }
  } catch {
    // ignore parse errors
  }

  const text = await response.text().catch(() => '');
  return text || fallback;
};

const getAccessToken = (): string => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }
  return accessToken;
};

export const favoritesApi = {
  async getMyFavorites(): Promise<Specialist[]> {
    const accessToken = getAccessToken();

    const response = await fetch('/api/favorites/my', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, `Ошибка HTTP при получении избранного: ${response.status}`));
    }

    const result: ApiResponse<Specialist[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Не удалось получить избранное');
    }

    return result.data || [];
  },

  async getFavoriteStatus(specialistId: number): Promise<boolean> {
    const accessToken = getAccessToken();

    const response = await fetch(`/api/favorites/${specialistId}/status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, `Ошибка HTTP при получении статуса избранного: ${response.status}`));
    }

    const result: ApiResponse<{ isFavorite: boolean }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Не удалось получить статус избранного');
    }

    return Boolean(result.data?.isFavorite);
  },

  async addFavorite(specialistId: number): Promise<void> {
    const accessToken = getAccessToken();

    const response = await fetch(`/api/favorites/${specialistId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, `Ошибка HTTP при добавлении в избранное: ${response.status}`));
    }

    const result: ApiResponse<null> = await response.json().catch(() => ({ success: true }));
    if (!result.success) {
      throw new Error(result.message || 'Не удалось добавить в избранное');
    }
  },

  async removeFavorite(specialistId: number): Promise<void> {
    const accessToken = getAccessToken();

    const response = await fetch(`/api/favorites/${specialistId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, `Ошибка HTTP при удалении из избранного: ${response.status}`));
    }

    const result: ApiResponse<null> = await response.json().catch(() => ({ success: true }));
    if (!result.success) {
      throw new Error(result.message || 'Не удалось удалить из избранного');
    }
  },
};
