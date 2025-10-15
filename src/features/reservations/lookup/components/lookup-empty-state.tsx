'use client';

import { Search, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function LookupEmptyState() {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">예약 조회</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          예약 번호와 연락처를 입력하여
          <br />
          예약 내역을 확인하실 수 있습니다.
        </p>

        <div className="w-full space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="text-left text-sm text-muted-foreground">
              <p className="font-medium">예약 번호는 어디에서 확인하나요?</p>
              <p className="mt-1">
                예약 완료 시 받으신 예약 번호를 입력해주세요. 예약 번호는
                영문자와 숫자로 구성된 12~16자리입니다.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          문의사항이 있으시면{' '}
          <a
            href="tel:1544-0000"
            className="font-medium text-primary hover:underline"
          >
            고객센터 1544-0000
          </a>
          로 연락주세요.
        </p>
      </CardContent>
    </Card>
  );
}
