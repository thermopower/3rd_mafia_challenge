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

type AuthModalMode = "login" | "signup";

type AuthState = {
  isLoading: boolean;
  isLoggedIn: boolean;
  currentUser: { id: string; name: string; email?: string } | null;
  error: string | null;
  showAuthModal: boolean;
  authModalMode: AuthModalMode;
  pendingRedirect: string | null;
};

type AuthAction =
  | { type: "LOGIN_START" }
  | {
      type: "LOGIN_SUCCESS";
      payload: { id: string; name: string; email?: string };
    }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "SIGNUP_START" }
  | {
      type: "SIGNUP_SUCCESS";
      payload: { id: string; name: string; email?: string };
    }
  | { type: "SIGNUP_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "OPEN_AUTH_MODAL"; payload: { mode: AuthModalMode; redirect?: string } }
  | { type: "CLOSE_AUTH_MODAL" }
  | { type: "SWITCH_AUTH_MODE"; payload: AuthModalMode }
  | { type: "CLEAR_ERROR" };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (mode: AuthModalMode, redirect?: string) => void;
  closeAuthModal: () => void;
  switchAuthMode: (mode: AuthModalMode) => void;
  clearError: () => void;
};

const initialState: AuthState = {
  isLoading: false,
  isLoggedIn: false,
  currentUser: null,
  error: null,
  showAuthModal: false,
  authModalMode: "login",
  pendingRedirect: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
    case "SIGNUP_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "SIGNUP_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isLoggedIn: true,
        currentUser: action.payload,
        error: null,
        showAuthModal: false,
        pendingRedirect: null,
      };
    case "LOGIN_FAILURE":
    case "SIGNUP_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isLoggedIn: false,
        currentUser: null,
        error: null,
      };
    case "OPEN_AUTH_MODAL":
      return {
        ...state,
        showAuthModal: true,
        authModalMode: action.payload.mode,
        pendingRedirect: action.payload.redirect || null,
        error: null,
      };
    case "CLOSE_AUTH_MODAL":
      return {
        ...state,
        showAuthModal: false,
        pendingRedirect: null,
        error: null,
      };
    case "SWITCH_AUTH_MODE":
      return {
        ...state,
        authModalMode: action.payload,
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
          email: data.user.email,
        },
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      dispatch({ type: "LOGIN_FAILURE", payload: errorMessage });
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, fullName?: string) => {
      dispatch({ type: "SIGNUP_START" });

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
            },
          },
        });

        if (error) {
          dispatch({ type: "SIGNUP_FAILURE", payload: error.message });
          return;
        }

        if (!data.user) {
          dispatch({
            type: "SIGNUP_FAILURE",
            payload: "회원가입에 실패했습니다.",
          });
          return;
        }

        const userName =
          (data.user.user_metadata?.full_name as string) || fullName || "사용자";

        dispatch({
          type: "SIGNUP_SUCCESS",
          payload: {
            id: data.user.id,
            name: userName,
            email: data.user.email,
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        dispatch({ type: "SIGNUP_FAILURE", payload: errorMessage });
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      dispatch({ type: "LOGOUT" });
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  }, []);

  const openAuthModal = useCallback((mode: AuthModalMode, redirect?: string) => {
    dispatch({ type: "OPEN_AUTH_MODAL", payload: { mode, redirect } });
  }, []);

  const closeAuthModal = useCallback(() => {
    dispatch({ type: "CLOSE_AUTH_MODAL" });
  }, []);

  const switchAuthMode = useCallback((mode: AuthModalMode) => {
    dispatch({ type: "SWITCH_AUTH_MODE", payload: mode });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login,
      signup,
      logout,
      openAuthModal,
      closeAuthModal,
      switchAuthMode,
      clearError,
    }),
    [state, login, signup, logout, openAuthModal, closeAuthModal, switchAuthMode, clearError]
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
