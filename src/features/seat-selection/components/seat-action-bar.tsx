"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { useBooking } from '@/features/common/contexts/booking-context';
import { useSeatCountdown } from '@/features/seat-selection/hooks/useSeatCountdown';

interface SeatActionBarProps {
  concertId: string;
  scheduleId?: string;
}

export const SeatActionBar = ({ concertId, scheduleId }: SeatActionBarProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    state,
    holdSeats,
    releaseSeats,
    resetSeats,
    isMaxSeatsReached,
  } = useBooking();

  const { formattedTime, isExpired } = useSeatCountdown({
    expiresAt: state.holdInfo?.expiresAt ?? null,
    onExpire: () => {
      handleExpire();
    },
  });

  const handleExpire = () => {
    if (state.holdInfo) {
      releaseSeats(state.holdInfo.holdId);
    }
    resetSeats();
    setError('좌석 선점 시간이 만료되었습니다. 다시 선택해주세요.');
  };

  const handleReset = () => {
    if (state.holdInfo) {
      releaseSeats(state.holdInfo.holdId);
    }
    resetSeats();
    setError(null);
  };

  const handleProceed = async () => {
    if (state.selectedSeats.length === 0) {
      setError('좌석을 선택해주세요.');
      return;
    }

    setError(null);

    try {
      await holdSeats(
        concertId,
        state.selectedSeats.map((s) => s.id)
      );

      // holdSeats가 성공하면 state.holdInfo가 자동으로 설정됨
      // 예매 정보 입력 페이지로 이동
      router.push('/booking');
    } catch (err) {
      const message = err instanceof Error ? err.message : '좌석 선점에 실패했습니다.';
      setError(message);
    }
  };

  const canProceed = state.selectedSeats.length > 0 && state.status !== 'holding';

  return (
    <Card className="p-6 space-y-4">
      {state.holdInfo && !isExpired && (
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
          disabled={state.selectedSeats.length === 0 && !state.holdInfo}
        >
          선택 초기화
        </Button>
        <Button
          className="flex-1"
          onClick={handleProceed}
          disabled={!canProceed}
        >
          {state.status === 'holding' ? '처리 중...' : '예매 진행'}
        </Button>
      </div>

      {state.selectedSeats.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {state.selectedSeats.length}석 선택됨
        </div>
      )}
    </Card>
  );
};
