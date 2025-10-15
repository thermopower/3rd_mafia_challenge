"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useSelectedSeatsStore } from '@/features/seat-selection/hooks/useSelectedSeatsStore';
import type { SeatCategory } from '@/features/seat-selection/lib/dto';

interface SelectedSeatSummaryProps {
  categories: SeatCategory[];
}

export const SelectedSeatSummary = ({ categories }: SelectedSeatSummaryProps) => {
  const { selectedSeats, deselectSeat, getTotalPrice } = useSelectedSeatsStore();

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '알 수 없음';
  };

  if (selectedSeats.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          좌석을 선택해주세요
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">선택한 좌석</h3>
          <div className="space-y-2">
            {selectedSeats.map((seat) => (
              <div
                key={seat.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{seat.seatLabel}</div>
                  <div className="text-sm text-muted-foreground">
                    {getCategoryName(seat.categoryId)} · {seat.price.toLocaleString()}원
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deselectSeat(seat.id)}
                  aria-label={`${seat.seatLabel} 선택 해제`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">선택 좌석 수</span>
            <span className="font-semibold">{selectedSeats.length}석</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-semibold">총 금액</span>
            <span className="text-xl font-bold text-primary">
              {getTotalPrice().toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
