"use client";

import { Suspense } from "react";
import { useMyFavorites } from "@/features/mypage/hooks/useMyFavorites";
import { FavoriteConcertCard } from "./favorite-concert-card";
import { EmptyState } from "./empty-state";
import { ListSkeleton } from "./list-skeleton";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

const FavoritesContent = () => {
  const { data } = useMyFavorites();
  const router = useRouter();

  if (data.favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="찜한 공연이 없습니다"
        description="마음에 드는 공연을 찾아 하트를 눌러보세요!"
        actionLabel="공연 둘러보기"
        onAction={() => router.push("/")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.favorites.map((concert) => (
        <FavoriteConcertCard key={concert.id} concert={concert} />
      ))}
    </div>
  );
};

export const FavoritesPanel = () => {
  return (
    <Suspense fallback={<ListSkeleton count={3} />}>
      <FavoritesContent />
    </Suspense>
  );
};
