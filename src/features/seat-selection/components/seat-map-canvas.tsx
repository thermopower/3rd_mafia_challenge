"use client";

import { cn } from '@/lib/utils';
import { useSelectedSeatsStore } from '@/features/seat-selection/hooks/useSelectedSeatsStore';
import { SeatStatus, type SeatInfo, type SeatCategory } from '@/features/seat-selection/lib/dto';
import { Circle, CheckCircle2, XCircle } from 'lucide-react';

interface SeatMapCanvasProps {
  seats: SeatInfo[];
  categories: SeatCategory[];
  onSeatClick?: (seat: SeatInfo) => void;
  className?: string;
}

export const SeatMapCanvas = ({
  seats,
  categories,
  onSeatClick,
  className,
}: SeatMapCanvasProps) => {
  const { selectedSeats, isSeatSelected } = useSelectedSeatsStore();

  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.displayColor || '#cccccc';
  };

  const getSeatIcon = (seat: SeatInfo) => {
    const isSelected = isSeatSelected(seat.id);
    const baseClasses = "w-6 h-6 transition-all cursor-pointer hover:scale-110";

    if (isSelected) {
      return (
        <CheckCircle2
          className={cn(baseClasses, "text-blue-500 fill-blue-500")}
          role="img"
          aria-label="선택된 좌석"
        />
      );
    }

    switch (seat.status) {
      case SeatStatus.AVAILABLE:
        return (
          <Circle
            className={cn(baseClasses, "text-green-500 fill-green-500")}
            style={{ color: getCategoryColor(seat.categoryId) }}
            role="img"
            aria-label="예매 가능 좌석"
          />
        );
      case SeatStatus.ON_HOLD:
        return (
          <Circle
            className={cn(baseClasses, "text-yellow-500 fill-yellow-500 cursor-not-allowed")}
            role="img"
            aria-label="다른 사용자 선점 중"
          />
        );
      case SeatStatus.SOLD:
        return (
          <XCircle
            className={cn(baseClasses, "text-gray-400 fill-gray-400 cursor-not-allowed")}
            role="img"
            aria-label="판매 완료"
          />
        );
      default:
        return null;
    }
  };

  const handleSeatClick = (seat: SeatInfo) => {
    if (seat.status === SeatStatus.AVAILABLE || isSeatSelected(seat.id)) {
      onSeatClick?.(seat);
    }
  };

  // 행/열 기준으로 좌석 그룹화
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.row ?? 0;
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat);
    return acc;
  }, {} as Record<number, SeatInfo[]>);

  const rows = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div
      className={cn("w-full overflow-auto", className)}
      role="grid"
      aria-label="콘서트 좌석 배치도"
    >
      <div className="inline-block min-w-full p-4">
        {/* 무대 표시 */}
        <div className="mb-6 text-center">
          <div className="inline-block px-16 py-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-t-lg">
            <span className="text-xs font-semibold text-gray-700">STAGE</span>
          </div>
        </div>

        {/* 좌석 배치 */}
        <div className="space-y-2">
          {rows.map((rowNum) => {
            const rowSeats = seatsByRow[rowNum].sort(
              (a, b) => (a.column ?? 0) - (b.column ?? 0)
            );

            return (
              <div
                key={rowNum}
                className="flex items-center justify-center gap-2"
                role="row"
                aria-label={`${rowNum + 1}번 행`}
              >
                <div className="w-8 text-center text-xs font-semibold text-muted-foreground">
                  {String.fromCharCode(65 + rowNum)}
                </div>
                {rowSeats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={
                      seat.status === SeatStatus.ON_HOLD ||
                      seat.status === SeatStatus.SOLD
                    }
                    className={cn(
                      "relative group",
                      seat.status !== SeatStatus.AVAILABLE &&
                        !isSeatSelected(seat.id) &&
                        "cursor-not-allowed"
                    )}
                    role="gridcell"
                    aria-label={`${seat.seatLabel} - ${
                      isSeatSelected(seat.id)
                        ? '선택됨'
                        : seat.status === SeatStatus.AVAILABLE
                        ? '예매 가능'
                        : seat.status === SeatStatus.ON_HOLD
                        ? '다른 사용자 선점 중'
                        : '판매 완료'
                    }`}
                  >
                    {getSeatIcon(seat)}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {seat.seatLabel}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
