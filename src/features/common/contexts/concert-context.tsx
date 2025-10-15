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
  ConcertItem,
  ConcertListResponse,
  ConcertListQuery,
  ConcertSort,
  RecommendedConcertsResponse,
} from "@/features/home/lib/dto";
import {
  ConcertListResponseSchema,
  RecommendedConcertsResponseSchema,
} from "@/features/home/lib/dto";

type ConcertStatus = "idle" | "loading" | "success" | "error";

type ConcertState = {
  status: ConcertStatus;
  allConcerts: ConcertItem[];
  filteredConcerts: ConcertItem[];
  recommendedConcerts: ConcertItem[];
  searchTerm: string;
  activeFilters: Partial<ConcertListQuery>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  error: string | null;
};

type ConcertAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      payload: {
        concerts: ConcertItem[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
      };
    }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "FETCH_RECOMMENDED_START" }
  | { type: "FETCH_RECOMMENDED_SUCCESS"; payload: ConcertItem[] }
  | { type: "FETCH_RECOMMENDED_FAILURE"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_FILTER"; payload: Partial<ConcertListQuery> }
  | { type: "CLEAR_FILTERS" };

type ConcertContextValue = {
  state: ConcertState;
  fetchConcerts: (filters?: Partial<ConcertListQuery>) => Promise<void>;
  fetchRecommendedConcerts: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilter: (filter: Partial<ConcertListQuery>) => void;
  clearFilters: () => void;
};

const initialState: ConcertState = {
  status: "idle",
  allConcerts: [],
  filteredConcerts: [],
  recommendedConcerts: [],
  searchTerm: "",
  activeFilters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  error: null,
};

function concertReducer(
  state: ConcertState,
  action: ConcertAction
): ConcertState {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        status: "success",
        allConcerts: action.payload.concerts,
        filteredConcerts: action.payload.concerts,
        pagination: {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        },
        error: null,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "FETCH_RECOMMENDED_START":
      return {
        ...state,
        error: null,
      };
    case "FETCH_RECOMMENDED_SUCCESS":
      return {
        ...state,
        recommendedConcerts: action.payload,
        error: null,
      };
    case "FETCH_RECOMMENDED_FAILURE":
      return {
        ...state,
        error: action.payload,
      };
    case "SET_SEARCH_TERM":
      return {
        ...state,
        searchTerm: action.payload,
        activeFilters: {
          ...state.activeFilters,
          search: action.payload || undefined,
        },
      };
    case "SET_FILTER":
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          ...action.payload,
        },
      };
    case "CLEAR_FILTERS":
      return {
        ...state,
        searchTerm: "",
        activeFilters: {},
      };
    default:
      return state;
  }
}

const ConcertContext = createContext<ConcertContextValue | null>(null);

type ConcertProviderProps = {
  children: ReactNode;
};

export const ConcertProvider = ({ children }: ConcertProviderProps) => {
  const [state, dispatch] = useReducer(concertReducer, initialState);

  const fetchConcerts = useCallback(
    async (filters: Partial<ConcertListQuery> = {}) => {
      dispatch({ type: "FETCH_START" });

      try {
        const params = new URLSearchParams();

        const mergedFilters = { ...state.activeFilters, ...filters };

        if (mergedFilters.search) {
          params.append("search", mergedFilters.search);
        }
        if (mergedFilters.category) {
          params.append("category", mergedFilters.category);
        }
        if (mergedFilters.sort) {
          params.append("sort", mergedFilters.sort);
        }
        if (mergedFilters.page) {
          params.append("page", mergedFilters.page.toString());
        }
        if (mergedFilters.limit) {
          params.append("limit", mergedFilters.limit.toString());
        }

        const response = await apiClient.get<ConcertListResponse>(
          `/api/concerts?${params.toString()}`
        );

        const parsed = ConcertListResponseSchema.safeParse(response.data);

        if (!parsed.success) {
          throw new Error("Invalid concert list response schema");
        }

        dispatch({
          type: "FETCH_SUCCESS",
          payload: {
            concerts: parsed.data.concerts,
            total: parsed.data.total,
            page: parsed.data.page,
            limit: parsed.data.limit,
            hasMore: parsed.data.hasMore,
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "콘서트 목록을 불러오는데 실패했습니다.";
        dispatch({ type: "FETCH_FAILURE", payload: errorMessage });
      }
    },
    [state.activeFilters]
  );

  const fetchRecommendedConcerts = useCallback(async () => {
    dispatch({ type: "FETCH_RECOMMENDED_START" });

    try {
      const response = await apiClient.get<RecommendedConcertsResponse>(
        "/api/concerts/recommendations"
      );

      const parsed = RecommendedConcertsResponseSchema.safeParse(
        response.data
      );

      if (!parsed.success) {
        throw new Error("Invalid recommended concerts response schema");
      }

      dispatch({
        type: "FETCH_RECOMMENDED_SUCCESS",
        payload: parsed.data.concerts,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "추천 콘서트를 불러오는데 실패했습니다.";
      dispatch({ type: "FETCH_RECOMMENDED_FAILURE", payload: errorMessage });
    }
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: "SET_SEARCH_TERM", payload: term });
  }, []);

  const setFilter = useCallback((filter: Partial<ConcertListQuery>) => {
    dispatch({ type: "SET_FILTER", payload: filter });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const value = useMemo<ConcertContextValue>(
    () => ({
      state,
      fetchConcerts,
      fetchRecommendedConcerts,
      setSearchTerm,
      setFilter,
      clearFilters,
    }),
    [
      state,
      fetchConcerts,
      fetchRecommendedConcerts,
      setSearchTerm,
      setFilter,
      clearFilters,
    ]
  );

  return (
    <ConcertContext.Provider value={value}>{children}</ConcertContext.Provider>
  );
};

export const useConcert = () => {
  const context = useContext(ConcertContext);

  if (!context) {
    throw new Error(
      "useConcert는 ConcertProvider 내부에서 사용되어야 합니다."
    );
  }

  return context;
};
