'use client';

import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: '처리 중',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  CONFIRMED: {
    label: '예약 확정',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  CANCELLED: {
    label: '예약 취소',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  EXPIRED: {
    label: '예약 만료',
    icon: AlertCircle,
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  },
};

export function ReservationStatusBadge({
  status,
  className,
}: ReservationStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
