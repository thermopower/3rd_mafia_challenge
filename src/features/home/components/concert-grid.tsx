"use client";

import { AlertCircle, Music } from 'lucide-react';
import type { ConcertItem } from '@/features/home/lib/dto';
import { ConcertCard } from './concert-card';

interface ConcertGridProps {
  concerts: ConcertItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  columns?: 3 | 4;
  onFavoriteToggle?: (concertId: string, isFavorite: boolean) => void;
}

export const ConcertGrid = ({
  concerts,
  isLoading = false,
  isError = false,
  error = null,
  emptyMessage = '표시할 공연이 없습니다',
  columns = 4,
  onFavoriteToggle,
}: ConcertGridProps) => {
  // Error State
  if (isError) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h3 className="text-lg font-semibold text-slate-900">
          데이터를 불러오는 중 오류가 발생했습니다
        </h3>
        <p className="text-sm text-slate-600 max-w-md text-center">
          {error?.message || '잠시 후 다시 시도해주세요'}
        </p>
      </div>
    );
  }

  // Empty State
  if (!isLoading && concerts.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-4">
        <Music className="w-16 h-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-900">{emptyMessage}</h3>
        <p className="text-sm text-slate-600">다른 검색어나 필터를 시도해보세요</p>
      </div>
    );
  }

  // Grid Layout
  const gridClassName =
    columns === 3
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6';

  return (
    <div className={gridClassName}>
      {concerts.map((concert) => (
        <ConcertCard
          key={concert.id}
          concert={concert}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  );
};
