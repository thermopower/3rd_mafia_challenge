"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FavoriteConcertItem } from "@/features/mypage/lib/dto";
import { useFavoriteToggle } from "@/features/common/hooks/useFavoriteToggle";
import { useRouter } from "next/navigation";

interface FavoriteConcertCardProps {
  concert: FavoriteConcertItem;
}

export const FavoriteConcertCard = ({
  concert,
}: FavoriteConcertCardProps) => {
  const router = useRouter();
  const favoriteToggle = useFavoriteToggle();

  const thumbnailUrl =
    concert.thumbnailUrl ||
    `https://picsum.photos/seed/${concert.concertId}/320/180`;

  const formattedDate = concert.concertDate
    ? format(new Date(concert.concertDate), "yyyy.MM.dd (E)", { locale: ko })
    : "일정 미정";

  const handleUnfavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    favoriteToggle.mutate({ concertId: concert.concertId });
  };

  const handleCardClick = () => {
    router.push(`/concerts/${concert.concertId}`);
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
      role="article"
      aria-label={`찜한 공연: ${concert.concertTitle}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <div className="relative w-full h-48">
            <img
              src={thumbnailUrl}
              alt={concert.concertTitle}
              className="w-full h-full object-cover"
            />
            {concert.isSoldOut && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive" className="text-base px-4 py-2">
                  매진
                </Badge>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
            onClick={handleUnfavorite}
            disabled={favoriteToggle.isPending}
            aria-label="찜 해제"
          >
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          </Button>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-base line-clamp-2">
            {concert.concertTitle}
          </h3>

          <div className="space-y-1 text-sm text-muted-foreground">
            {concert.concertDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>{formattedDate}</span>
                {concert.isUpcoming && (
                  <Badge variant="secondary" className="ml-auto">
                    임박
                  </Badge>
                )}
              </div>
            )}
            {concert.concertVenue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span className="truncate">{concert.concertVenue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
