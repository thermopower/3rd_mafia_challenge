import { create } from 'zustand';

export interface SelectedSeat {
  id: string;
  seatLabel: string;
  categoryId: string;
  price: number;
}

interface HoldInfo {
  holdId: string;
  expiresAt: string;
}

interface SelectedSeatsState {
  selectedSeats: SelectedSeat[];
  holdInfo: HoldInfo | null;
  maxSeats: number;
}

interface SelectedSeatsActions {
  selectSeat: (seat: SelectedSeat) => boolean;
  deselectSeat: (seatId: string) => void;
  resetSeats: () => void;
  setHoldInfo: (holdInfo: HoldInfo | null) => void;
  getTotalPrice: () => number;
  isMaxSeatsReached: () => boolean;
  isSeatSelected: (seatId: string) => boolean;
}

type SelectedSeatsStore = SelectedSeatsState & SelectedSeatsActions;

const MAX_SEATS_PER_BOOKING = 4;

export const useSelectedSeatsStore = create<SelectedSeatsStore>((set, get) => ({
  selectedSeats: [],
  holdInfo: null,
  maxSeats: MAX_SEATS_PER_BOOKING,

  selectSeat: (seat: SelectedSeat) => {
    const { selectedSeats, maxSeats } = get();

    if (selectedSeats.length >= maxSeats) {
      return false;
    }

    const alreadySelected = selectedSeats.some((s) => s.id === seat.id);
    if (alreadySelected) {
      return false;
    }

    set({
      selectedSeats: [...selectedSeats, seat],
    });

    return true;
  },

  deselectSeat: (seatId: string) => {
    set((state) => ({
      selectedSeats: state.selectedSeats.filter((s) => s.id !== seatId),
    }));
  },

  resetSeats: () => {
    set({
      selectedSeats: [],
      holdInfo: null,
    });
  },

  setHoldInfo: (holdInfo: HoldInfo | null) => {
    set({ holdInfo });
  },

  getTotalPrice: () => {
    const { selectedSeats } = get();
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  },

  isMaxSeatsReached: () => {
    const { selectedSeats, maxSeats } = get();
    return selectedSeats.length >= maxSeats;
  },

  isSeatSelected: (seatId: string) => {
    const { selectedSeats } = get();
    return selectedSeats.some((s) => s.id === seatId);
  },
}));
