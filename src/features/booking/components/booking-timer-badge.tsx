'use client';

import { AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBookingCountdown } from '../hooks/useBookingCountdown';
import { cn } from '@/lib/utils';

interface BookingTimerBadgeProps {
  expiresAt?: string;
  onExpire?: () => void;
  className?: string;
}

export const BookingTimerBadge = ({
  expiresAt,
  onExpire,
  className,
}: BookingTimerBadgeProps) => {
  const { formattedTime, isExpired, remainingSeconds } =
    useBookingCountdown(expiresAt);

  const isWarning = remainingSeconds > 0 && remainingSeconds <= 60;

  if (isExpired && onExpire) {
    onExpire();
  }

  return (
    <Badge
      variant={isExpired ? 'destructive' : isWarning ? 'outline' : 'secondary'}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-sm font-medium',
        isWarning && 'border-orange-500 text-orange-600',
        className,
      )}
    >
      {isExpired ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>선점 시간 만료</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4" />
          <span>남은 시간: {formattedTime}</span>
        </>
      )}
    </Badge>
  );
};
