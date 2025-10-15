"use client";

import { Badge } from "@/components/ui/badge";
import type { ConcertDetailResponse } from "@/features/concert-detail/lib/dto";

interface AvailabilityBadgeProps {
  status: ConcertDetailResponse["status"];
}

const statusConfig = {
  ON_SALE: {
    label: "예매 가능",
    variant: "default" as const,
    className: "bg-green-500 hover:bg-green-600",
  },
  CLOSE_SOON: {
    label: "마감 임박",
    variant: "default" as const,
    className: "bg-orange-500 hover:bg-orange-600",
  },
  SOLD_OUT: {
    label: "매진",
    variant: "destructive" as const,
    className: "",
  },
  ENDED: {
    label: "공연 종료",
    variant: "secondary" as const,
    className: "",
  },
};

export const AvailabilityBadge = ({ status }: AvailabilityBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={config.className}
      aria-label={`공연 상태: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
};
