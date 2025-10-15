"use client";

import { Circle, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SeatStatus, type SeatCategory } from '@/features/seat-selection/lib/dto';

interface SeatLegendProps {
  categories?: SeatCategory[];
}

export const SeatLegend = ({ categories = [] }: SeatLegendProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">좌석 상태</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-green-500 fill-green-500" />
              <span className="text-xs text-muted-foreground">예매 가능</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
              <span className="text-xs text-muted-foreground">선택됨</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-muted-foreground">다른 사용자 선점 중</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-gray-400 fill-gray-400" />
              <span className="text-xs text-muted-foreground">판매 완료</span>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">좌석 등급</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.displayColor }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {category.name} ({category.price.toLocaleString()}원)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
