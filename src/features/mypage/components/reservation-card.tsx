"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ReservationItem } from "@/features/mypage/lib/dto";
import { cn } from "@/lib/utils";

interface ReservationCardProps {
  reservation: ReservationItem;
}

const STATUS_CONFIG = {
  pending: { label: "결제 대기", variant: "secondary" as const },
  confirmed: { label: "예매 확정", variant: "default" as const },
  cancelled: { label: "예매 취소", variant: "destructive" as const },
  expired: { label: "만료됨", variant: "outline" as const },
};

export const ReservationCard = ({ reservation }: ReservationCardProps) => {
  const statusConfig = STATUS_CONFIG[reservation.status];
  const thumbnailUrl = `https://picsum.photos/seed/${reservation.id}/320/180`;

  const formattedDate = format(
    new Date(reservation.concertDate),
    "yyyy년 M월 d일 (E) HH:mm",
    { locale: ko }
  );

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow"
      role="article"
      aria-label={`예매 번호 ${reservation.reservationNumber}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
            <img
              src={thumbnailUrl}
              alt={reservation.concertTitle}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-semibold line-clamp-2">
                {reservation.concertTitle}
              </h3>
              <Badge variant={statusConfig.variant} className="flex-shrink-0">
                {statusConfig.label}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" aria-hidden="true" />
                <span>
                  {reservation.seats.length}석 ·{" "}
                  {reservation.seats.map((s) => s.seatLabel).join(", ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">예매번호:</span>
                <span className="font-mono">{reservation.reservationNumber}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">총 결제금액</span>
              <span className="text-lg font-bold">
                {reservation.totalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
