export interface Review {
  id: number;
  specialist_id: number;
  user_id: number;
  rating: number;           // 1-5 звёзд
  comment: string;          // Текст отзыва
  is_verified: boolean;     // Проверен ли отзыв (покупка услуги)
  is_approved: boolean;     // Одобрено модератором
  created_at: Date;
  updated_at: Date;
  user_name?: string;       // Имя пользователя (для отображения)
  user_avatar?: string;     // Аватар пользователя
}

export interface CreateReviewDto {
  specialist_id: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  success: boolean;
  data?: Review | Review[];
  total?: number;
  average_rating?: number;
  message?: string;
}