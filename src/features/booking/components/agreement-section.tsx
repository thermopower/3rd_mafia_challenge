'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgreementSectionProps {
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
}

export const AgreementSection = ({
  agreed,
  onAgreedChange,
}: AgreementSectionProps) => {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">약관 동의</h3>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="terms-required"
          checked={agreed}
          onCheckedChange={(checked) => onAgreedChange(checked === true)}
        />
        <div className="flex-1">
          <Label
            htmlFor="terms-required"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            (필수) 개인정보 수집 및 이용 동의
          </Label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                전문 보기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>개인정보 수집 및 이용 동의</DialogTitle>
              </DialogHeader>
              <ScrollArea className="mt-4 h-[400px] rounded-md border p-4">
                <div className="space-y-4 text-sm">
                  <p>
                    TicketGem (이하 &apos;회사&apos;)은(는) 예매 서비스 제공을 위해
                    아래와 같이 개인정보를 수집·이용합니다.
                  </p>
                  <div>
                    <h4 className="font-semibold">1. 수집 항목</h4>
                    <p>- 필수: 이름, 이메일, 전화번호</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">2. 수집 목적</h4>
                    <p>
                      - 예매 확인 및 취소 처리
                      <br />- 예매 관련 안내 및 고객 문의 응대
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">3. 보유 기간</h4>
                    <p>- 예매 완료 후 5년간 보관 (전자상거래법 준수)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">4. 동의 거부 권리</h4>
                    <p>
                      - 위 개인정보 수집·이용에 대한 동의를 거부할 권리가
                      있으나, 동의를 거부할 경우 예매 서비스 이용이
                      제한됩니다.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!agreed && (
        <p className="text-sm text-destructive">
          필수 약관에 동의해주셔야 예매가 가능합니다.
        </p>
      )}
    </div>
  );
};
