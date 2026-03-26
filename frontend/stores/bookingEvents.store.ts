import { create } from 'zustand';

interface BookingEventsState {
  appointmentsVersion: number;
  touchAppointments: () => void;
}

export const useBookingEventsStore = create<BookingEventsState>((set) => ({
  appointmentsVersion: 0,
  touchAppointments: () =>
    set((state) => ({
      appointmentsVersion: state.appointmentsVersion + 1,
    })),
}));
