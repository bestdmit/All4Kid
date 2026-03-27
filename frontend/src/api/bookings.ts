export interface Slot {
  id: number;
  specialist_id: number;
  starts_at: string;
  ends_at: string;
  price: number;
  is_booked: boolean;
}

export interface Appointment {
  id: number;
  specialist_id: number;
  parent_user_id: number;
  slot_id: number;
  child_name: string;
  child_birth_date?: string | null;
  comment: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled_by_parent'
    | 'cancelled_by_specialist'
    | 'completed'
    | 'no_show';
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  specialist_name?: string;
  specialist_phone?: string;
  specialist_specialty?: string;
  parent_name?: string;
  parent_phone?: string;
  starts_at?: string;
  ends_at?: string;
  price?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
}

export interface CreateAppointmentDto {
  slotId: number;
  childName: string;
  childBirthDate?: string;
  comment?: string;
}

export interface CreateSlotDto {
  startsAt: string;
  endsAt: string;
  price?: number;
}

export interface DeleteChildAppointmentsDto {
  childName: string;
  childBirthDate?: string | null;
}

export const bookingsApi = {
  async parseErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
      const json = await response.json();
      if (typeof json?.message === 'string' && json.message.trim()) {
        return json.message;
      }
    } catch {
      // ignore parse errors and use fallback
    }

    const text = await response.text().catch(() => '');
    return text || fallback;
  },

  async getSpecialistSlots(specialistId: number, date?: string): Promise<Slot[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const url = `/api/specialists/${specialistId}/slots${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении слотов: ${response.status}`);
    }

    const result: ApiResponse<Slot[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Не удалось получить слоты');
    }

    return result.data || [];
  },

  async createAppointment(specialistId: number, dto: CreateAppointmentDto): Promise<Appointment> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch(`/api/specialists/${specialistId}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(dto),
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для создания записи'));
    }

    if (!response.ok) {
      throw new Error(await bookingsApi.parseErrorMessage(response, `Ошибка HTTP при создании записи: ${response.status}`));
    }

    const result: ApiResponse<Appointment> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Не удалось создать запись');
    }

    return result.data;
  },

  async createSpecialistSlot(specialistId: number, dto: CreateSlotDto): Promise<Slot> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch(`/api/specialists/${specialistId}/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(dto),
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для создания слота'));
    }

    if (!response.ok) {
      throw new Error(await bookingsApi.parseErrorMessage(response, `Ошибка HTTP при создании слота: ${response.status}`));
    }

    const result: ApiResponse<Slot> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Не удалось создать слот');
    }

    return result.data;
  },

  async deleteSpecialistSlot(specialistId: number, slotId: number): Promise<void> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch(`/api/specialists/${specialistId}/slots/${slotId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для удаления слота'));
    }

    if (!response.ok) {
      throw new Error(await bookingsApi.parseErrorMessage(response, `Ошибка HTTP при удалении слота: ${response.status}`));
    }

    const result: ApiResponse<unknown> = await response.json().catch(() => ({ success: true }));
    if (!result.success) {
      throw new Error(result.message || 'Не удалось удалить слот');
    }
  },

  async getMyAppointments(): Promise<Appointment[]> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch('/api/appointments/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для просмотра записей'));
    }

    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении записей: ${response.status}`);
    }

    const result: ApiResponse<Appointment[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Не удалось получить записи');
    }

    return result.data || [];
  },

  async getMySpecialistAppointments(adminMode = false): Promise<Appointment[]> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const url = adminMode ? '/api/appointments/specialist/me?adminMode=true' : '/api/appointments/specialist/me';
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для просмотра записей специалиста'));
    }

    if (!response.ok) {
      throw new Error(`Ошибка HTTP при получении записей специалиста: ${response.status}`);
    }

    const result: ApiResponse<Appointment[]> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Не удалось получить записи специалиста');
    }

    return result.data || [];
  },

  async updateAppointmentStatus(appointmentId: number, status: Appointment['status'], cancelReason?: string): Promise<Appointment> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status, cancelReason }),
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для изменения статуса'));
    }

    if (!response.ok) {
      throw new Error(await bookingsApi.parseErrorMessage(response, `Ошибка HTTP при обновлении статуса: ${response.status}`));
    }

    const result: ApiResponse<Appointment> = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Не удалось обновить статус записи');
    }

    return result.data;
  },

  async hideAppointment(appointmentId: number): Promise<void> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch(`/api/appointments/${appointmentId}/hide`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для скрытия записи'));
    }

    if (!response.ok) {
      throw new Error(await bookingsApi.parseErrorMessage(response, `Ошибка HTTP при скрытии записи: ${response.status}`));
    }

    const result: ApiResponse<unknown> = await response.json().catch(() => ({ success: true }));
    if (!result.success) {
      throw new Error(result.message || 'Не удалось скрыть запись');
    }
  },

  async deleteAppointmentsByChild(dto: DeleteChildAppointmentsDto): Promise<number> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('UNAUTHORIZED');
    }

    const response = await fetch('/api/appointments/by-child', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(dto),
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      throw new Error(await bookingsApi.parseErrorMessage(response, 'Недостаточно прав для удаления записей ребенка'));
    }

    if (!response.ok) {
      throw new Error(await bookingsApi.parseErrorMessage(response, `Ошибка HTTP при удалении записей ребенка: ${response.status}`));
    }

    const result: ApiResponse<{ deletedCount?: number }> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Не удалось удалить записи ребенка');
    }

    return result.data?.deletedCount || 0;
  },
};
