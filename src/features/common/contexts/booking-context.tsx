"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { apiClient } from "@/lib/remote/api-client";
import type {
  SeatHoldRequest,
  SeatHoldResponse,
  SeatReleaseRequest,
  SeatReleaseResponse,
} from "@/features/seat-selection/lib/dto";
import {
  SeatHoldRequestSchema,
  SeatHoldResponseSchema,
  SeatReleaseRequestSchema,
  SeatReleaseResponseSchema,
} from "@/features/seat-selection/lib/dto";
import type {
  BookingSessionResponse,
  BookingConfirmRequest,
  BookingConfirmResponse,
  BookingSeat,
} from "@/features/booking/lib/dto";
import {
  BookingSessionResponseSchema,
  BookingConfirmRequestSchema,
  BookingConfirmResponseSchema,
} from "@/features/booking/lib/dto";

type BookingStatus =
  | "idle"
  | "loading"
  | "selecting"
  | "holding"
  | "confirming"
  | "success"
  | "error";

type SelectedSeat = {
  id: string;
  seatLabel: string;
  categoryId: string;
  price: number;
};

type HoldInfo = {
  holdId: string;
  expiresAt: string;
  totalPrice: number;
};

type BookingState = {
  status: BookingStatus;
  concertInfo: { id: string; name: string } | null;
  selectedSeats: SelectedSeat[];
  holdInfo: HoldInfo | null;
  bookingSession: BookingSessionResponse | null;
  bookingResult: BookingConfirmResponse | null;
  maxSeats: number;
  error: string | null;
};

type BookingAction =
  | { type: "START_SELECTING"; payload: { id: string; name: string } }
  | { type: "SELECT_SEAT"; payload: SelectedSeat }
  | { type: "DESELECT_SEAT"; payload: string }
  | { type: "RESET_SEATS" }
  | { type: "HOLD_SEATS_START" }
  | {
      type: "HOLD_SEATS_SUCCESS";
      payload: { holdId: string; expiresAt: string; totalPrice: number };
    }
  | { type: "HOLD_SEATS_FAILURE"; payload: string }
  | { type: "RELEASE_SEATS_START" }
  | { type: "RELEASE_SEATS_SUCCESS" }
  | { type: "RELEASE_SEATS_FAILURE"; payload: string }
  | { type: "FETCH_SESSION_START" }
  | { type: "FETCH_SESSION_SUCCESS"; payload: BookingSessionResponse }
  | { type: "FETCH_SESSION_FAILURE"; payload: string }
  | { type: "CONFIRM_BOOKING_START" }
  | { type: "CONFIRM_BOOKING_SUCCESS"; payload: BookingConfirmResponse }
  | { type: "CONFIRM_BOOKING_FAILURE"; payload: string }
  | { type: "RESET_BOOKING" };

type BookingContextValue = {
  state: BookingState;
  startSelecting: (concertId: string, concertName: string) => void;
  selectSeat: (seat: SelectedSeat) => boolean;
  deselectSeat: (seatId: string) => void;
  resetSeats: () => void;
  holdSeats: (concertId: string, seatIds: string[]) => Promise<void>;
  releaseSeats: (holdId: string) => Promise<void>;
  fetchBookingSession: (holdId?: string) => Promise<void>;
  confirmBooking: (request: BookingConfirmRequest) => Promise<void>;
  resetBooking: () => void;
  isMaxSeatsReached: () => boolean;
  isSeatSelected: (seatId: string) => boolean;
  getTotalPrice: () => number;
};

const MAX_SEATS_PER_BOOKING = 4;

const initialState: BookingState = {
  status: "idle",
  concertInfo: null,
  selectedSeats: [],
  holdInfo: null,
  bookingSession: null,
  bookingResult: null,
  maxSeats: MAX_SEATS_PER_BOOKING,
  error: null,
};

function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  switch (action.type) {
    case "START_SELECTING":
      return {
        ...state,
        status: "selecting",
        concertInfo: action.payload,
        error: null,
      };
    case "SELECT_SEAT": {
      const isAlreadySelected = state.selectedSeats.some(
        (seat) => seat.id === action.payload.id
      );
      if (isAlreadySelected || state.selectedSeats.length >= state.maxSeats) {
        return state;
      }
      return {
        ...state,
        selectedSeats: [...state.selectedSeats, action.payload],
      };
    }
    case "DESELECT_SEAT":
      return {
        ...state,
        selectedSeats: state.selectedSeats.filter(
          (seat) => seat.id !== action.payload
        ),
      };
    case "RESET_SEATS":
      return {
        ...state,
        selectedSeats: [],
      };
    case "HOLD_SEATS_START":
      return {
        ...state,
        status: "holding",
        error: null,
      };
    case "HOLD_SEATS_SUCCESS":
      return {
        ...state,
        status: "success",
        holdInfo: action.payload,
        error: null,
      };
    case "HOLD_SEATS_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "RELEASE_SEATS_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "RELEASE_SEATS_SUCCESS":
      return {
        ...state,
        status: "idle",
        holdInfo: null,
        selectedSeats: [],
        error: null,
      };
    case "RELEASE_SEATS_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "FETCH_SESSION_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "FETCH_SESSION_SUCCESS":
      return {
        ...state,
        status: "success",
        bookingSession: action.payload,
        error: null,
      };
    case "FETCH_SESSION_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "CONFIRM_BOOKING_START":
      return {
        ...state,
        status: "confirming",
        error: null,
      };
    case "CONFIRM_BOOKING_SUCCESS":
      return {
        ...state,
        status: "success",
        bookingResult: action.payload,
        error: null,
      };
    case "CONFIRM_BOOKING_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "RESET_BOOKING":
      return initialState;
    default:
      return state;
  }
}

const BookingContext = createContext<BookingContextValue | null>(null);

type BookingProviderProps = {
  children: ReactNode;
};

export const BookingProvider = ({ children }: BookingProviderProps) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const startSelecting = useCallback(
    (concertId: string, concertName: string) => {
      dispatch({
        type: "START_SELECTING",
        payload: { id: concertId, name: concertName },
      });
    },
    []
  );

  const selectSeat = useCallback((seat: SelectedSeat): boolean => {
    const isAlreadySelected = state.selectedSeats.some((s) => s.id === seat.id);
    if (isAlreadySelected || state.selectedSeats.length >= state.maxSeats) {
      return false;
    }

    dispatch({ type: "SELECT_SEAT", payload: seat });
    return true;
  }, [state.selectedSeats, state.maxSeats]);

  const deselectSeat = useCallback((seatId: string) => {
    dispatch({ type: "DESELECT_SEAT", payload: seatId });
  }, []);

  const resetSeats = useCallback(() => {
    dispatch({ type: "RESET_SEATS" });
  }, []);

  const holdSeats = useCallback(
    async (concertId: string, seatIds: string[]) => {
      dispatch({ type: "HOLD_SEATS_START" });

      try {
        const request: SeatHoldRequest = {
          concertId,
          seatIds,
        };

        const validated = SeatHoldRequestSchema.safeParse(request);

        if (!validated.success) {
          throw new Error("Invalid seat hold request");
        }

        const response = await apiClient.post<SeatHoldResponse>(
          "/api/reservations/hold",
          validated.data
        );

        const parsed = SeatHoldResponseSchema.safeParse(response.data);

        if (!parsed.success) {
          throw new Error("Invalid seat hold response schema");
        }

        dispatch({
          type: "HOLD_SEATS_SUCCESS",
          payload: {
            holdId: parsed.data.holdId,
            expiresAt: parsed.data.expiresAt,
            totalPrice: parsed.data.totalPrice,
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "좌석 선점에 실패했습니다.";
        dispatch({ type: "HOLD_SEATS_FAILURE", payload: errorMessage });
      }
    },
    []
  );

  const releaseSeats = useCallback(async (holdId: string) => {
    dispatch({ type: "RELEASE_SEATS_START" });

    try {
      const request: SeatReleaseRequest = { holdId };

      const validated = SeatReleaseRequestSchema.safeParse(request);

      if (!validated.success) {
        throw new Error("Invalid seat release request");
      }

      const response = await apiClient.post<SeatReleaseResponse>(
        "/api/reservations/release",
        validated.data
      );

      const parsed = SeatReleaseResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error("Invalid seat release response schema");
      }

      dispatch({ type: "RELEASE_SEATS_SUCCESS" });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "좌석 선점 해제에 실패했습니다.";
      dispatch({ type: "RELEASE_SEATS_FAILURE", payload: errorMessage });
    }
  }, []);

  const fetchBookingSession = useCallback(async (holdId?: string) => {
    dispatch({ type: "FETCH_SESSION_START" });

    try {
      const response = await apiClient.get<BookingSessionResponse>(
        "/api/reservations/current",
        {
          headers: holdId ? { "x-hold-id": holdId } : undefined,
        }
      );

      const parsed = BookingSessionResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error("Invalid booking session data received");
      }

      dispatch({ type: "FETCH_SESSION_SUCCESS", payload: parsed.data });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "예매 세션을 불러오는데 실패했습니다.";
      dispatch({ type: "FETCH_SESSION_FAILURE", payload: errorMessage });
    }
  }, []);

  const confirmBooking = useCallback(
    async (request: BookingConfirmRequest) => {
      dispatch({ type: "CONFIRM_BOOKING_START" });

      try {
        const validated = BookingConfirmRequestSchema.safeParse(request);

        if (!validated.success) {
          throw new Error("Invalid confirm request");
        }

        const response = await apiClient.post<BookingConfirmResponse>(
          "/api/reservations/confirm",
          validated.data
        );

        const parsed = BookingConfirmResponseSchema.safeParse(response.data);

        if (!parsed.success) {
          throw new Error("Invalid confirm response");
        }

        dispatch({ type: "CONFIRM_BOOKING_SUCCESS", payload: parsed.data });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "예매 확정에 실패했습니다.";
        dispatch({ type: "CONFIRM_BOOKING_FAILURE", payload: errorMessage });
      }
    },
    []
  );

  const resetBooking = useCallback(() => {
    dispatch({ type: "RESET_BOOKING" });
  }, []);

  const isMaxSeatsReached = useCallback(() => {
    return state.selectedSeats.length >= state.maxSeats;
  }, [state.selectedSeats.length, state.maxSeats]);

  const isSeatSelected = useCallback(
    (seatId: string) => {
      return state.selectedSeats.some((s) => s.id === seatId);
    },
    [state.selectedSeats]
  );

  const getTotalPrice = useCallback(() => {
    return state.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }, [state.selectedSeats]);

  const value = useMemo<BookingContextValue>(
    () => ({
      state,
      startSelecting,
      selectSeat,
      deselectSeat,
      resetSeats,
      holdSeats,
      releaseSeats,
      fetchBookingSession,
      confirmBooking,
      resetBooking,
      isMaxSeatsReached,
      isSeatSelected,
      getTotalPrice,
    }),
    [
      state,
      startSelecting,
      selectSeat,
      deselectSeat,
      resetSeats,
      holdSeats,
      releaseSeats,
      fetchBookingSession,
      confirmBooking,
      resetBooking,
      isMaxSeatsReached,
      isSeatSelected,
      getTotalPrice,
    ]
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);

  if (!context) {
    throw new Error(
      "useBooking은 BookingProvider 내부에서 사용되어야 합니다."
    );
  }

  return context;
};
