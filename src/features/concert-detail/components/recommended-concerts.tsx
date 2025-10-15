"use client";

import { useRecommendedConcerts } from "@/features/home/hooks/useRecommendedConcerts";
import { ConcertCard } from "@/features/home/components/concert-card";

interface RecommendedConcertsProps {
  currentConcertId: string;
}

export const RecommendedConcerts = ({
  currentConcertId,
}: RecommendedConcertsProps) => {
  const { data, isLoading, isError } = useRecommendedConcerts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">추천 공연</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  // 현재 콘서트 제외
  const filteredConcerts = data.concerts.filter(
    (concert) => concert.id !== currentConcertId
  );

  if (filteredConcerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">추천 공연</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredConcerts.slice(0, 4).map((concert) => (
          <ConcertCard key={concert.id} concert={concert} />
        ))}
      </div>
    </div>
  );
};
