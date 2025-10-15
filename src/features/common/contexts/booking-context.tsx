"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Seat, BookingInfo } from "../types";

type BookingStatus =
  | "idle"
  | "loading"
  | "selecting"
  | "confirming"
  | "success"
  | "error";

type BookingState = {
  status: BookingStatus;
  concertInfo: { id: string; name: string } | null;
  allSeats: Seat[];
  selectedSeats: Seat[];
  bookingResult: BookingInfo | null;
  error: string | null;
};

type BookingAction =
  | { type: "START_BOOKING"; payload: { id: string; name: string } }
  | { type: "LOAD_SEATS_START" }
  | { type: "LOAD_SEATS_SUCCESS"; payload: Seat[] }
  | { type: "LOAD_SEATS_FAILURE"; payload: string }
  | { type: "SELECT_SEAT"; payload: Seat }
  | { type: "DESELECT_SEAT"; payload: string }
  | { type: "CONFIRM_BOOKING_START" }
  | {
      type: "CONFIRM_BOOKING_SUCCESS";
      payload: BookingInfo;
    }
  | { type: "CONFIRM_BOOKING_FAILURE"; payload: string }
  | { type: "RESET_BOOKING" };

type BookingContextValue = {
  state: BookingState;
  startBooking: (concertId: string, concertName: string) => Promise<void>;
  selectSeat: (seat: Seat) => void;
  deselectSeat: (seatId: string) => void;
  confirmBooking: (bookingDetails: {
    bookerName: string;
    bookerContact: string;
  }) => Promise<void>;
  resetBooking: () => void;
};

const initialState: BookingState = {
  status: "idle",
  concertInfo: null,
  allSeats: [],
  selectedSeats: [],
  bookingResult: null,
  error: null,
};

function bookingReducer(
  state: BookingState,
  action: BookingAction
): BookingState {
  switch (action.type) {
    case "START_BOOKING":
      return {
        ...state,
        status: "loading",
        concertInfo: action.payload,
        error: null,
      };
    case "LOAD_SEATS_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "LOAD_SEATS_SUCCESS":
      return {
        ...state,
        status: "selecting",
        allSeats: action.payload,
        error: null,
      };
    case "LOAD_SEATS_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "SELECT_SEAT": {
      const isAlreadySelected = state.selectedSeats.some(
        (seat) => seat.id === action.payload.id
      );
      if (isAlreadySelected) {
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

  const startBooking = useCallback(
    async (concertId: string, concertName: string) => {
      dispatch({
        type: "START_BOOKING",
        payload: { id: concertId, name: concertName },
      });

      dispatch({ type: "LOAD_SEATS_START" });

      try {
        const response = await fetch(`/api/concerts/${concertId}/seats`);

        if (!response.ok) {
          throw new Error("좌석 정보를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        dispatch({ type: "LOAD_SEATS_SUCCESS", payload: data.seats || [] });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        dispatch({ type: "LOAD_SEATS_FAILURE", payload: errorMessage });
      }
    },
    []
  );

  const selectSeat = useCallback((seat: Seat) => {
    dispatch({ type: "SELECT_SEAT", payload: seat });
  }, []);

  const deselectSeat = useCallback((seatId: string) => {
    dispatch({ type: "DESELECT_SEAT", payload: seatId });
  }, []);

  const confirmBooking = useCallback(
    async (bookingDetails: { bookerName: string; bookerContact: string }) => {
      dispatch({ type: "CONFIRM_BOOKING_START" });

      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            concertId: state.concertInfo?.id,
            seatIds: state.selectedSeats.map((seat) => seat.id),
            bookerName: bookingDetails.bookerName,
            bookerContact: bookingDetails.bookerContact,
          }),
        });

        if (!response.ok) {
          throw new Error("예매에 실패했습니다.");
        }

        const data = await response.json();
        dispatch({
          type: "CONFIRM_BOOKING_SUCCESS",
          payload: data.booking,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        dispatch({ type: "CONFIRM_BOOKING_FAILURE", payload: errorMessage });
      }
    },
    [state.concertInfo?.id, state.selectedSeats]
  );

  const resetBooking = useCallback(() => {
    dispatch({ type: "RESET_BOOKING" });
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({
      state,
      startBooking,
      selectSeat,
      deselectSeat,
      confirmBooking,
      resetBooking,
    }),
    [state, startBooking, selectSeat, deselectSeat, confirmBooking, resetBooking]
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
