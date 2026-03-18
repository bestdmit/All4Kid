import { useCallback, useEffect, useMemo, useState } from 'react';
import { bookingsApi, type Slot } from '../../src/api/bookings';

function formatDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useSpecialistSlots = (specialistId: number, date: Date) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  const dateKey = useMemo(() => formatDateOnly(date), [date]);

  const fetchSlots = useCallback(async () => {
    if (!specialistId) {
      setSlots([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await bookingsApi.getSpecialistSlots(specialistId, dateKey);
      setSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при загрузке слотов');
    } finally {
      setLoading(false);
    }
  }, [specialistId, dateKey]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return {
    loading,
    error,
    slots,
    dateKey,
    refetch: fetchSlots,
  };
};
