"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { useSelectedSeatsStore } from '@/features/seat-selection/hooks/useSelectedSeatsStore';
import { useSeatHoldMutation } from '@/features/seat-selection/hooks/useSeatHoldMutation';
import { useSeatReleaseMutation } from '@/features/seat-selection/hooks/useSeatReleaseMutation';
import { useSeatCountdown } from '@/features/seat-selection/hooks/useSeatCountdown';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

interface SeatActionBarProps {
  concertId: string;
  scheduleId?: string;
}

export const SeatActionBar = ({ concertId, scheduleId }: SeatActionBarProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    selectedSeats,
    holdInfo,
    resetSeats,
    setHoldInfo,
    isMaxSeatsReached,
  } = useSelectedSeatsStore();

  const holdMutation = useSeatHoldMutation();
  const releaseMutation = useSeatReleaseMutation();

  const { formattedTime, isExpired } = useSeatCountdown({
    expiresAt: holdInfo?.expiresAt ?? null,
    onExpire: () => {
      handleExpire();
    },
  });

  const handleExpire = () => {
    if (holdInfo) {
      releaseMutation.mutate({ holdId: holdInfo.holdId });
    }
    resetSeats();
    setError('좌석 선점 시간이 만료되었습니다. 다시 선택해주세요.');
  };

  const handleReset = () => {
    if (holdInfo) {
      releaseMutation.mutate({ holdId: holdInfo.holdId });
    }
    resetSeats();
    setError(null);
  };

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      setError('좌석을 선택해주세요.');
      return;
    }

    setError(null);

    try {
      const result = await holdMutation.mutateAsync({
        concertId,
        scheduleId,
        seatIds: selectedSeats.map((s) => s.id),
      });

      setHoldInfo({
        holdId: result.holdId,
        expiresAt: result.expiresAt,
      });

      // 예매 정보 입력 페이지로 이동
      router.push('/booking');
    } catch (err) {
      const message = extractApiErrorMessage(err, '좌석 선점에 실패했습니다.');
      setError(message);
    }
  };

  const canProceed = selectedSeats.length > 0 && !holdMutation.isPending;

  return (
    <Card className="p-6 space-y-4">
      {holdInfo && !isExpired && (
        <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">
            남은 시간: {formattedTime}
          </span>
        </div>
      )}

      {isMaxSeatsReached() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            최대 4석까지 선택할 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleReset}
          disabled={selectedSeats.length === 0 && !holdInfo}
        >
          선택 초기화
        </Button>
        <Button
          className="flex-1"
          onClick={handleProceed}
          disabled={!canProceed}
        >
          {holdMutation.isPending ? '처리 중...' : '예매 진행'}
        </Button>
      </div>

      {selectedSeats.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {selectedSeats.length}석 선택됨
        </div>
      )}
    </Card>
  );
};
