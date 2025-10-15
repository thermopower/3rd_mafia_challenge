"use client";

import { Badge } from "@/components/ui/badge";
import type { SeatCategory } from "@/features/concert-detail/lib/dto";

interface PricingTableProps {
  seatCategories: SeatCategory[];
}

export const PricingTable = ({ seatCategories }: PricingTableProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  if (seatCategories.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        좌석 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">좌석 등급 및 가격</h2>
      <div className="space-y-3">
        {seatCategories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 shrink-0 rounded"
                style={{ backgroundColor: category.displayColor }}
                aria-label={`${category.name} 등급 색상`}
              />
              <div className="space-y-1">
                <p className="font-semibold">{category.name}</p>
                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 sm:flex-row-reverse">
              <p className="text-lg font-bold">
                {formatPrice(category.price)}
              </p>
              <div className="text-sm">
                {category.availableSeats > 0 ? (
                  <Badge variant="outline" className="bg-green-50">
                    잔여 {category.availableSeats}석
                  </Badge>
                ) : (
                  <Badge variant="destructive">매진</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
