import { useEffect } from 'react';
import { useSpecialistStore } from '../stores/specialistStore';

export const useSpecialists = () => {
  const { specialists, loading, error, fetchSpecialists } = useSpecialistStore();

  useEffect(() => {
    if (specialists.length === 0) {
      fetchSpecialists();
    }
  }, [fetchSpecialists, specialists.length]);

  return {
    specialists,
    loading,
    error,
    refetch: fetchSpecialists,
  };
};