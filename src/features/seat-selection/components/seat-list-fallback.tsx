"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSelectedSeatsStore } from '@/features/seat-selection/hooks/useSelectedSeatsStore';
import { SeatStatus, type SeatInfo, type SeatCategory } from '@/features/seat-selection/lib/dto';
import { Check } from 'lucide-react';

interface SeatListFallbackProps {
  seats: SeatInfo[];
  categories: SeatCategory[];
  onSeatClick?: (seat: SeatInfo) => void;
}

export const SeatListFallback = ({
  seats,
  categories,
  onSeatClick,
}: SeatListFallbackProps) => {
  const { isSeatSelected } = useSelectedSeatsStore();
  const [sortBy, setSortBy] = useState<'label' | 'price'>('label');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const filteredSeats = seats.filter((seat) => {
    if (filterCategory && seat.categoryId !== filterCategory) {
      return false;
    }
    return seat.status === SeatStatus.AVAILABLE || isSeatSelected(seat.id);
  });

  const sortedSeats = [...filteredSeats].sort((a, b) => {
    if (sortBy === 'label') {
      return a.seatLabel.localeCompare(b.seatLabel);
    }
    const categoryA = getCategoryInfo(a.categoryId);
    const categoryB = getCategoryInfo(b.categoryId);
    return (categoryA?.price ?? 0) - (categoryB?.price ?? 0);
  });

  const getSeatStatusBadge = (seat: SeatInfo) => {
    if (isSeatSelected(seat.id)) {
      return <Badge className="bg-blue-500">선택됨</Badge>;
    }
    if (seat.status === SeatStatus.AVAILABLE) {
      return <Badge variant="outline" className="border-green-500 text-green-600">예매 가능</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={sortBy === 'label' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('label')}
        >
          좌석 번호순
        </Button>
        <Button
          variant={sortBy === 'price' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('price')}
        >
          가격순
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory(null)}
        >
          전체
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={filterCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedSeats.map((seat) => {
          const categoryInfo = getCategoryInfo(seat.categoryId);
          const isSelected = isSeatSelected(seat.id);
          const isAvailable = seat.status === SeatStatus.AVAILABLE;

          return (
            <Card
              key={seat.id}
              className={cn(
                "p-3 cursor-pointer transition-colors",
                isSelected && "border-blue-500 bg-blue-50",
                !isAvailable && !isSelected && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => {
                if (isAvailable || isSelected) {
                  onSeatClick?.(seat);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                  <div>
                    <div className="font-semibold">{seat.seatLabel}</div>
                    {categoryInfo && (
                      <div className="text-sm text-muted-foreground">
                        {categoryInfo.name} - {categoryInfo.price.toLocaleString()}원
                      </div>
                    )}
                  </div>
                </div>
                {getSeatStatusBadge(seat)}
              </div>
            </Card>
          );
        })}
      </div>

      {sortedSeats.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          선택 가능한 좌석이 없습니다.
        </Card>
      )}
    </div>
  );
};
