"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConcertDetailResponse } from "@/features/concert-detail/lib/dto";
import { AvailabilityBadge } from "./availability-badge";
import { useUser } from "@/features/common/contexts/user-context";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAuth } from "@/features/common/contexts/auth-context";
import { cn } from "@/lib/utils";

interface ConcertHeroSectionProps {
  concert: ConcertDetailResponse;
}

export const ConcertHeroSection = ({ concert }: ConcertHeroSectionProps) => {
  const { user } = useCurrentUser();
  const { openAuthModal } = useAuth();
  const { toggleFavorite } = useUser();
  const [isPending, setIsPending] = useState(false);

  const handleFavoriteClick = async () => {
    if (!user) {
      openAuthModal("login");
      return;
    }

    setIsPending(true);
    try {
      await toggleFavorite(concert.id);
    } catch (error) {
      console.error("찜하기 실패:", error);
    } finally {
      setIsPending(false);
    }
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
            disabled={isPending}
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
