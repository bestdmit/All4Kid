import { useCallback, useEffect, useState } from 'react';
import { bookingsApi, type Appointment } from '../../src/api/bookings';

export const useMyAppointments = (enabled: boolean) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = useCallback(async () => {
    if (!enabled) {
      setAppointments([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await bookingsApi.getMyAppointments();
      setAppointments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при загрузке записей');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    loading,
    error,
    appointments,
    refetch: fetchAppointments,
  };
};
