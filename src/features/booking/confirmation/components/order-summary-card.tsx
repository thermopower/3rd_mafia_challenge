'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OrderSummaryCardProps {
  reservationNumber: string;
  confirmedAt: string | null;
  totalPrice: number;
}

export const OrderSummaryCard = ({
  reservationNumber,
  confirmedAt,
  totalPrice,
}: OrderSummaryCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reservationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy reservation number', error);
    }
  };

  const formattedDate = confirmedAt
    ? new Date(confirmedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '확인 중';

  const formattedPrice = new Intl.NumberFormat('ko-KR').format(totalPrice);

  return (
    <Card>
      <CardHeader>
        <CardTitle>예매 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">예매 번호</p>
            <p className="text-lg font-semibold text-gray-900">
              {reservationNumber}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check size={16} />
                복사됨
              </>
            ) : (
              <>
                <Copy size={16} />
                복사
              </>
            )}
          </Button>
        </div>

        <div>
          <p className="text-sm text-gray-600">예매 일시</p>
          <p className="text-base font-medium text-gray-900">{formattedDate}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">총 결제 금액</p>
          <p className="text-xl font-bold text-gray-900">{formattedPrice}원</p>
        </div>
      </CardContent>
    </Card>
  );
};
