'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaymentCTAProps {
  onConfirm: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  isExpired?: boolean;
}

export const PaymentCTA = ({
  onConfirm,
  isLoading,
  disabled,
  isExpired,
}: PaymentCTAProps) => {
  return (
    <div className="sticky bottom-0 border-t bg-background p-4">
      <Button
        onClick={onConfirm}
        disabled={disabled || isLoading || isExpired}
        className="w-full"
        size="lg"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isExpired ? '선점 시간이 만료되었습니다' : '예매 확정'}
      </Button>
    </div>
  );
};
