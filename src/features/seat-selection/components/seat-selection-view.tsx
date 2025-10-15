"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useSeatMap } from '@/features/seat-selection/hooks/useSeatMap';
import { useSelectedSeatsStore } from '@/features/seat-selection/hooks/useSelectedSeatsStore';
import { SeatLegend } from './seat-legend';
import { SeatMapCanvas } from './seat-map-canvas';
import { SeatListFallback } from './seat-list-fallback';
import { SelectedSeatSummary } from './selected-seat-summary';
import { SeatActionBar } from './seat-action-bar';
import type { SeatInfo } from '@/features/seat-selection/lib/dto';

interface SeatSelectionViewProps {
  concertId: string;
  scheduleId?: string;
}

export const SeatSelectionView = ({
  concertId,
  scheduleId,
}: SeatSelectionViewProps) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const { data: seatMap } = useSeatMap({ concertId, scheduleId });
  const { selectSeat, deselectSeat, isSeatSelected, isMaxSeatsReached } =
    useSelectedSeatsStore();

  const handleSeatClick = (seat: SeatInfo) => {
    const isSelected = isSeatSelected(seat.id);

    if (isSelected) {
      deselectSeat(seat.id);
      return;
    }

    if (isMaxSeatsReached()) {
      return;
    }

    const categoryInfo = seatMap.categories.find(
      (c) => c.id === seat.categoryId
    );

    const success = selectSeat({
      id: seat.id,
      seatLabel: seat.seatLabel,
      categoryId: seat.categoryId,
      price: categoryInfo?.price ?? 0,
    });

    if (!success && isMaxSeatsReached()) {
      // 최대 좌석 수 초과 시 처리는 SeatActionBar에서 표시
    }
  };

  if (!seatMap) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{seatMap.concertTitle}</h1>
        <p className="text-muted-foreground">좌석을 선택해주세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌석 지도 영역 */}
        <div className="lg:col-span-2 space-y-4">
          <SeatLegend categories={seatMap.categories} />

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'map' | 'list')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map">좌석 지도</TabsTrigger>
              <TabsTrigger value="list">리스트 보기</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-4">
              <Card>
                <SeatMapCanvas
                  seats={seatMap.seats}
                  categories={seatMap.categories}
                  onSeatClick={handleSeatClick}
                  className="min-h-96"
                />
              </Card>
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              <SeatListFallback
                seats={seatMap.seats}
                categories={seatMap.categories}
                onSeatClick={handleSeatClick}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* 선택 요약 및 액션 영역 */}
        <div className="space-y-4">
          <SelectedSeatSummary categories={seatMap.categories} />
          <SeatActionBar concertId={concertId} scheduleId={scheduleId} />
        </div>
      </div>
    </div>
  );
};

export const SeatSelectionViewSkeleton = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
};

export const SeatSelectionViewError = ({ error }: { error: Error }) => {
  return (
    <div className="container mx-auto p-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>좌석 정보를 불러올 수 없습니다</AlertTitle>
        <AlertDescription>
          {error.message || '다시 시도해주세요.'}
        </AlertDescription>
      </Alert>
    </div>
  );
};
