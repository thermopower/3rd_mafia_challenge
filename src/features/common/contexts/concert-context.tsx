"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Concert } from "../types";

type ConcertStatus = "idle" | "loading" | "success" | "error";

type ConcertState = {
  status: ConcertStatus;
  allConcerts: Concert[];
  filteredConcerts: Concert[];
  searchTerm: string;
  activeFilters: { genre?: string; date?: string };
  error: string | null;
};

type ConcertAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Concert[] }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_FILTER"; payload: { genre?: string; date?: string } }
  | { type: "CLEAR_FILTERS" }
  | { type: "APPLY_FILTERS" };

type ConcertContextValue = {
  state: ConcertState;
  fetchConcerts: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilter: (filter: { genre?: string; date?: string }) => void;
  clearFilters: () => void;
};

const initialState: ConcertState = {
  status: "idle",
  allConcerts: [],
  filteredConcerts: [],
  searchTerm: "",
  activeFilters: {},
  error: null,
};

function applyFiltersToData(
  concerts: Concert[],
  searchTerm: string,
  filters: { genre?: string; date?: string }
): Concert[] {
  let result = [...concerts];

  if (searchTerm.trim()) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    result = result.filter((concert) =>
      concert.title.toLowerCase().includes(lowerSearchTerm)
    );
  }

  if (filters.genre) {
  }

  if (filters.date) {
  }

  return result;
}

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
    case "FETCH_SUCCESS": {
      const filtered = applyFiltersToData(
        action.payload,
        state.searchTerm,
        state.activeFilters
      );
      return {
        ...state,
        status: "success",
        allConcerts: action.payload,
        filteredConcerts: filtered,
        error: null,
      };
    }
    case "FETCH_FAILURE":
      return {
        ...state,
        status: "error",
        error: action.payload,
      };
    case "SET_SEARCH_TERM": {
      const filtered = applyFiltersToData(
        state.allConcerts,
        action.payload,
        state.activeFilters
      );
      return {
        ...state,
        searchTerm: action.payload,
        filteredConcerts: filtered,
      };
    }
    case "SET_FILTER": {
      const newFilters = { ...state.activeFilters, ...action.payload };
      const filtered = applyFiltersToData(
        state.allConcerts,
        state.searchTerm,
        newFilters
      );
      return {
        ...state,
        activeFilters: newFilters,
        filteredConcerts: filtered,
      };
    }
    case "CLEAR_FILTERS": {
      const filtered = applyFiltersToData(state.allConcerts, "", {});
      return {
        ...state,
        searchTerm: "",
        activeFilters: {},
        filteredConcerts: filtered,
      };
    }
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

  const fetchConcerts = useCallback(async () => {
    dispatch({ type: "FETCH_START" });

    try {
      const response = await fetch("/api/concerts");

      if (!response.ok) {
        throw new Error("콘서트 목록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data.concerts || [] });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      dispatch({ type: "FETCH_FAILURE", payload: errorMessage });
    }
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: "SET_SEARCH_TERM", payload: term });
  }, []);

  const setFilter = useCallback(
    (filter: { genre?: string; date?: string }) => {
      dispatch({ type: "SET_FILTER", payload: filter });
    },
    []
  );

  const clearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const value = useMemo<ConcertContextValue>(
    () => ({
      state,
      fetchConcerts,
      setSearchTerm,
      setFilter,
      clearFilters,
    }),
    [state, fetchConcerts, setSearchTerm, setFilter, clearFilters]
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
