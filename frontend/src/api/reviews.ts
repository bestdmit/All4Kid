export interface Review {
  id: number;
  specialist_id: number;
  user_id: number;
  rating: number;
  comment: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface ReviewsResponse {
  success: boolean;
  data?: Review[];
  total?: number;
  average_rating?: number;
  message?: string;
}

export interface CreateReviewDto {
  rating: number;
  comment: string;
}

export interface CreateReviewResponse {
  success: boolean;
  data?: Review;
  average_rating?: number;
  message?: string;
}

export const reviewsApi = {
  fetchBySpecialistId: async (specialistId: number): Promise<ReviewsResponse> => {
    const response = await fetch(`/api/specialists/${specialistId}/reviews`);
    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении отзывов: ${response.status}`);
    }
    return response.json();
  },

  fetchUnapproved: async (): Promise<ReviewsResponse> => {
    const response = await fetch(`/api/admin/reviews`);
    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении отзывов: ${response.status}`);
    }
    return response.json();
  },

  createForSpecialist: async (specialistId: number, dto: CreateReviewDto): Promise<CreateReviewResponse> => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("UNAUTHORIZED");
    }

    const response = await fetch(`/api/specialists/${specialistId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(dto),
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Ошибка HTTP при создании отзыва: ${response.status}`);
    }

    return response.json();
  },

  approve: async (reviewId: number) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("UNAUTHORIZED");
    }

    const response = await fetch(`/api/admin/review/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({"id": reviewId}),
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Ошибка HTTP при подтверждении отзыва: ${response.status}`);
    }

    return response.json();
  },

  delete: async (reviewId: number) => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("UNAUTHORIZED");
    }

    const response = await fetch(`/api/admin/review/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({"id": reviewId}),
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Ошибка HTTP при удалении отзыва: ${response.status}`);
    }

    return response.json();
  },
};

