"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { BookingInfo, Concert, Notification } from "../types";

type UserStatus = "idle" | "loading" | "success" | "error";

type UserState = {
  status: UserStatus;
  myBookings: BookingInfo[];
  wishlist: Concert[];
  notifications: Notification[];
  hasNewNotification: boolean;
  error: string | null;
};

type UserAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: {
        bookings: BookingInfo[];
        wishlist: Concert[];
        notifications: Notification[];
      };
    }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "TOGGLE_WISHLIST_START" }
  | { type: "ADD_WISHLIST_SUCCESS"; payload: Concert }
  | { type: "REMOVE_WISHLIST_SUCCESS"; payload: string }
  | { type: "WISHLIST_FAILURE"; payload: string }
  | { type: "READ_NOTIFICATION"; payload: string }
  | { type: "CLEAR_ALL_NOTIFICATIONS" };

type UserContextValue = {
  state: UserState;
  fetchUserData: () => Promise<void>;
  toggleWishlist: (concert: Concert) => Promise<void>;
  readNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
};

const initialState: UserState = {
  status: "idle",
  myBookings: [],
  wishlist: [],
  notifications: [],
  hasNewNotification: false,
  error: null,
};

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "FETCH_SUCCESS": {
      const hasUnread = action.payload.notifications.some(
        (notif) => !notif.isRead
      );
      return {
        ...state,
        status: "success",
        myBookings: action.payload.bookings,
        wishlist: action.payload.wishlist,
        notifications: action.payload.notifications,
        hasNewNotification: hasUnread,
        error: null,
      };
    }
    case "FETCH_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "TOGGLE_WISHLIST_START":
      return {
        ...state,
        error: null,
      };
    case "ADD_WISHLIST_SUCCESS": {
      const exists = state.wishlist.some(
        (concert) => concert.id === action.payload.id
      );
      if (exists) {
        return state;
      }
      return {
        ...state,
        wishlist: [...state.wishlist, action.payload],
      };
    }
    case "REMOVE_WISHLIST_SUCCESS":
      return {
        ...state,
        wishlist: state.wishlist.filter(
          (concert) => concert.id !== action.payload
        ),
      };
    case "WISHLIST_FAILURE":
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

  const fetchUserData = useCallback(async () => {
    dispatch({ type: "FETCH_START" });

    try {
      const [bookingsRes, wishlistRes, notificationsRes] = await Promise.all([
        fetch("/api/user/bookings"),
        fetch("/api/user/wishlist"),
        fetch("/api/user/notifications"),
      ]);

      if (!bookingsRes.ok || !wishlistRes.ok || !notificationsRes.ok) {
        throw new Error("사용자 데이터를 불러오는데 실패했습니다.");
      }

      const [bookingsData, wishlistData, notificationsData] =
        await Promise.all([
          bookingsRes.json(),
          wishlistRes.json(),
          notificationsRes.json(),
        ]);

      dispatch({
        type: "FETCH_SUCCESS",
        payload: {
          bookings: bookingsData.bookings || [],
          wishlist: wishlistData.wishlist || [],
          notifications: notificationsData.notifications || [],
        },
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      dispatch({ type: "FETCH_FAILURE", payload: errorMessage });
    }
  }, []);

  const toggleWishlist = useCallback(
    async (concert: Concert) => {
      dispatch({ type: "TOGGLE_WISHLIST_START" });

      const isInWishlist = state.wishlist.some((c) => c.id === concert.id);

      try {
        if (isInWishlist) {
          const response = await fetch(
            `/api/user/wishlist/${concert.id}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            throw new Error("찜 삭제에 실패했습니다.");
          }

          dispatch({
            type: "REMOVE_WISHLIST_SUCCESS",
            payload: concert.id,
          });
        } else {
          const response = await fetch("/api/user/wishlist", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ concertId: concert.id }),
          });

          if (!response.ok) {
            throw new Error("찜 추가에 실패했습니다.");
          }

          dispatch({
            type: "ADD_WISHLIST_SUCCESS",
            payload: concert,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        dispatch({ type: "WISHLIST_FAILURE", payload: errorMessage });
      }
    },
    [state.wishlist]
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
      fetchUserData,
      toggleWishlist,
      readNotification,
      clearAllNotifications,
    }),
    [
      state,
      fetchUserData,
      toggleWishlist,
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
