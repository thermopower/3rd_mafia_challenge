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
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  ReservationItem,
  MyReservationsResponse,
  FavoriteConcertItem,
  MyFavoritesResponse,
} from "@/features/mypage/lib/dto";
import {
  MyReservationsResponseSchema,
  MyFavoritesResponseSchema,
} from "@/features/mypage/lib/dto";
import type {
  FavoriteToggleRequest,
  FavoriteToggleResponse,
} from "@/features/favorites/lib/dto";
import { FavoriteToggleResponseSchema } from "@/features/favorites/lib/dto";
import type { Notification } from "../types";

type UserStatus = "idle" | "loading" | "success" | "error";

type UserState = {
  status: UserStatus;
  myReservations: ReservationItem[];
  myFavorites: FavoriteConcertItem[];
  notifications: Notification[];
  hasNewNotification: boolean;
  error: string | null;
};

type UserAction =
  | { type: "FETCH_RESERVATIONS_START" }
  | { type: "FETCH_RESERVATIONS_SUCCESS"; payload: ReservationItem[] }
  | { type: "FETCH_RESERVATIONS_FAILURE"; payload: string }
  | { type: "FETCH_FAVORITES_START" }
  | { type: "FETCH_FAVORITES_SUCCESS"; payload: FavoriteConcertItem[] }
  | { type: "FETCH_FAVORITES_FAILURE"; payload: string }
  | { type: "TOGGLE_FAVORITE_START" }
  | {
      type: "TOGGLE_FAVORITE_SUCCESS";
      payload: { concertId: string; isFavorite: boolean };
    }
  | { type: "TOGGLE_FAVORITE_FAILURE"; payload: string }
  | { type: "READ_NOTIFICATION"; payload: string }
  | { type: "CLEAR_ALL_NOTIFICATIONS" };

type UserContextValue = {
  state: UserState;
  fetchMyReservations: () => Promise<void>;
  fetchMyFavorites: () => Promise<void>;
  toggleFavorite: (concertId: string) => Promise<boolean>;
  readNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
};

const initialState: UserState = {
  status: "idle",
  myReservations: [],
  myFavorites: [],
  notifications: [],
  hasNewNotification: false,
  error: null,
};

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "FETCH_RESERVATIONS_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "FETCH_RESERVATIONS_SUCCESS":
      return {
        ...state,
        status: "success",
        myReservations: action.payload,
        error: null,
      };
    case "FETCH_RESERVATIONS_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "FETCH_FAVORITES_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "FETCH_FAVORITES_SUCCESS":
      return {
        ...state,
        status: "success",
        myFavorites: action.payload,
        error: null,
      };
    case "FETCH_FAVORITES_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "TOGGLE_FAVORITE_START":
      return {
        ...state,
        error: null,
      };
    case "TOGGLE_FAVORITE_SUCCESS": {
      const { concertId, isFavorite } = action.payload;
      if (!isFavorite) {
        // 찜 제거됨
        return {
          ...state,
          myFavorites: state.myFavorites.filter(
            (fav) => fav.concertId !== concertId
          ),
        };
      }
      // 찜 추가는 fetchMyFavorites로 다시 가져오는 것이 안전
      return state;
    }
    case "TOGGLE_FAVORITE_FAILURE":
      return {
        ...state,
        error: action.payload,
      };
    case "READ_NOTIFICATION": {
      const updatedNotifications = state.notifications.map((notif) =>
        notif.id === action.payload ? { ...notif, isRead: true } : notif
      );
      const hasUnread = updatedNotifications.some((notif) => !notif.isRead);
      return {
        ...state,
        notifications: updatedNotifications,
        hasNewNotification: hasUnread,
      };
    }
    case "CLEAR_ALL_NOTIFICATIONS":
      return {
        ...state,
        notifications: [],
        hasNewNotification: false,
      };
    default:
      return state;
  }
}

const UserContext = createContext<UserContextValue | null>(null);

type UserProviderProps = {
  children: ReactNode;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const fetchMyReservations = useCallback(async () => {
    dispatch({ type: "FETCH_RESERVATIONS_START" });

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await apiClient.get<MyReservationsResponse>(
        "/api/mypage/reservations",
        {
          headers: {
            Authorization: `Bearer ${session.user.id}`,
          },
        }
      );

      const parsed = MyReservationsResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error("Invalid reservations response schema");
      }

      dispatch({
        type: "FETCH_RESERVATIONS_SUCCESS",
        payload: parsed.data.reservations,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "예매 내역을 불러오는데 실패했습니다.";
      dispatch({ type: "FETCH_RESERVATIONS_FAILURE", payload: errorMessage });
    }
  }, []);

  const fetchMyFavorites = useCallback(async () => {
    dispatch({ type: "FETCH_FAVORITES_START" });

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await apiClient.get<MyFavoritesResponse>(
        "/api/mypage/favorites",
        {
          headers: {
            Authorization: `Bearer ${session.user.id}`,
          },
        }
      );

      const parsed = MyFavoritesResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error("Invalid favorites response schema");
      }

      dispatch({
        type: "FETCH_FAVORITES_SUCCESS",
        payload: parsed.data.favorites,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "찜 목록을 불러오는데 실패했습니다.";
      dispatch({ type: "FETCH_FAVORITES_FAILURE", payload: errorMessage });
    }
  }, []);

  const toggleFavorite = useCallback(
    async (concertId: string): Promise<boolean> => {
      dispatch({ type: "TOGGLE_FAVORITE_START" });

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("로그인이 필요합니다.");
        }

        const request: FavoriteToggleRequest = { concertId };

        const response = await apiClient.post<FavoriteToggleResponse>(
          "/api/favorites/toggle",
          request,
          {
            headers: {
              Authorization: `Bearer ${session.user.id}`,
            },
          }
        );

        const parsed = FavoriteToggleResponseSchema.safeParse(response.data);

        if (!parsed.success) {
          throw new Error("Invalid favorite toggle response schema");
        }

        dispatch({
          type: "TOGGLE_FAVORITE_SUCCESS",
          payload: { concertId, isFavorite: parsed.data.isFavorite },
        });

        return parsed.data.isFavorite;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "찜하기 처리에 실패했습니다.";
        dispatch({ type: "TOGGLE_FAVORITE_FAILURE", payload: errorMessage });
        throw err;
      }
    },
    []
  );

  const readNotification = useCallback((notificationId: string) => {
    dispatch({ type: "READ_NOTIFICATION", payload: notificationId });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: "CLEAR_ALL_NOTIFICATIONS" });
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      state,
      fetchMyReservations,
      fetchMyFavorites,
      toggleFavorite,
      readNotification,
      clearAllNotifications,
    }),
    [
      state,
      fetchMyReservations,
      fetchMyFavorites,
      toggleFavorite,
      readNotification,
      clearAllNotifications,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser는 UserProvider 내부에서 사용되어야 합니다.");
  }

  return context;
};
