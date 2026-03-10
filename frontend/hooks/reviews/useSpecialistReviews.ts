import { useCallback, useEffect, useState } from "react";
import { reviewsApi, type Review } from "../../src/api/reviews";

export const useSpecialistReviews = (specialistId: number) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);

  const fetch = useCallback(async () => {
    if (!specialistId) {
      setReviews([]);
      setTotal(0);
      setAverageRating(0);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await reviewsApi.fetchBySpecialistId(specialistId);
      if (!res.success) {
        throw new Error(res.message || "Ошибка формата данных при получении отзывов");
      }
      setReviews(res.data || []);
      setTotal(res.total || 0);
      setAverageRating(res.average_rating || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка при получении отзывов");
    } finally {
      setLoading(false);
    }
  }, [specialistId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    loading,
    error,
    reviews,
    total,
    averageRating,
    refetch: fetch,
  };
};

