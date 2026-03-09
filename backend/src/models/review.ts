export interface Review {
  id: number;
  specialist_id: number;
  user_id: number;
  rating: number;
  comment: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: Date;
  updated_at: Date;
  user_name?: string;
  user_avatar?: string;
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
