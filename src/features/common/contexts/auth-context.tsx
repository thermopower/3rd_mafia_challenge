"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type AuthState = {
  isLoading: boolean;
  isLoggedIn: boolean;
  currentUser: { id: string; name: string } | null;
  error: string | null;
  showLoginModal: boolean;
};

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { id: string; name: string } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "OPEN_LOGIN_MODAL" }
  | { type: "CLOSE_LOGIN_MODAL" }
  | { type: "CLEAR_ERROR" };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  clearError: () => void;
};

const initialState: AuthState = {
  isLoading: false,
  isLoggedIn: false,
  currentUser: null,
  error: null,
  showLoginModal: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isLoggedIn: true,
        currentUser: action.payload,
        error: null,
        showLoginModal: false,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        isLoading: false,
        isLoggedIn: false,
        currentUser: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isLoggedIn: false,
        currentUser: null,
        error: null,
      };
    case "OPEN_LOGIN_MODAL":
      return {
        ...state,
        showLoginModal: true,
        error: null,
      };
    case "CLOSE_LOGIN_MODAL":
      return {
        ...state,
        showLoginModal: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        dispatch({ type: "LOGIN_FAILURE", payload: error.message });
        return;
      }

      if (!data.user) {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: "로그인에 실패했습니다.",
        });
        return;
      }

      const userName =
        (data.user.user_metadata?.full_name as string) ||
        data.user.email?.split("@")[0] ||
        "사용자";

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          id: data.user.id,
          name: userName,
        },
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      dispatch({ type: "LOGIN_FAILURE", payload: errorMessage });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      dispatch({ type: "LOGOUT" });
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  }, []);

  const openLoginModal = useCallback(() => {
    dispatch({ type: "OPEN_LOGIN_MODAL" });
  }, []);

  const closeLoginModal = useCallback(() => {
    dispatch({ type: "CLOSE_LOGIN_MODAL" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login,
      logout,
      openLoginModal,
      closeLoginModal,
      clearError,
    }),
    [state, login, logout, openLoginModal, closeLoginModal, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서 사용되어야 합니다.");
  }

  return context;
};
