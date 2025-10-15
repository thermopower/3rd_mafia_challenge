"use client";

import { Calendar, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { ConcertDetailResponse } from "@/features/concert-detail/lib/dto";

interface ConcertMetaListProps {
  concert: ConcertDetailResponse;
}

export const ConcertMetaList = ({ concert }: ConcertMetaListProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy년 M월 d일 (E) HH:mm", {
        locale: ko,
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}시간 ${mins}분`;
    }
    if (hours > 0) {
      return `${hours}시간`;
    }
    return `${mins}분`;
  };

  const metaItems = [
    {
      icon: Calendar,
      label: "공연 일정",
      value:
        concert.startDate && concert.endDate
          ? `${formatDate(concert.startDate)} ~ ${formatDate(concert.endDate)}`
          : formatDate(concert.startDate),
    },
    {
      icon: Clock,
      label: "공연 시간",
      value: formatDuration(concert.durationMinutes),
    },
    {
      icon: MapPin,
      label: "공연 장소",
      value: concert.venueName || "-",
      detail: concert.venueAddress,
    },
    {
      icon: User,
      label: "관람 등급",
      value: concert.ageRating || "-",
    },
  ];

  return (
    <dl className="space-y-4 rounded-lg border bg-card p-6">
      {metaItems.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3"
        >
          <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">
              {item.label}
            </dt>
            <dd className="text-base font-medium">{item.value}</dd>
            {item.detail && (
              <dd className="text-sm text-muted-foreground">{item.detail}</dd>
            )}
          </div>
        </div>
      ))}
    </dl>
  );
};
