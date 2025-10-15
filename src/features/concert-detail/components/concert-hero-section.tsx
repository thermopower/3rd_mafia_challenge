"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConcertDetailResponse } from "@/features/concert-detail/lib/dto";
import { AvailabilityBadge } from "./availability-badge";
import { useFavoriteToggle } from "@/features/common/hooks/useFavoriteToggle";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

interface ConcertHeroSectionProps {
  concert: ConcertDetailResponse;
}

export const ConcertHeroSection = ({ concert }: ConcertHeroSectionProps) => {
  const { user } = useCurrentUser();
  const favoriteToggle = useFavoriteToggle();

  const handleFavoriteClick = () => {
    if (!user) {
      // TODO: 로그인 모달 열기
      alert("로그인이 필요한 서비스입니다.");
      return;
    }

    favoriteToggle.mutate({
      concertId: concert.id,
    });
  };

  return (
    <div className="space-y-6">
      {/* 썸네일 이미지 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={concert.thumbnailUrl}
          alt={concert.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute right-4 top-4">
          <AvailabilityBadge status={concert.status} />
        </div>
      </div>

      {/* 기본 정보 및 찜하기 버튼 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              {concert.title}
            </h1>
            {concert.artist && (
              <p className="text-lg text-muted-foreground">{concert.artist}</p>
            )}
          </div>

          <Button
            variant={concert.isFavorite ? "default" : "outline"}
            size="icon"
            onClick={handleFavoriteClick}
            disabled={favoriteToggle.isPending}
            aria-label={concert.isFavorite ? "찜 취소" : "찜하기"}
            className={cn(
              "shrink-0",
              concert.isFavorite &&
                "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            <Heart
              className={cn("h-5 w-5", concert.isFavorite && "fill-current")}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};
