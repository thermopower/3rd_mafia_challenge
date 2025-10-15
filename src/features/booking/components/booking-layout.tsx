'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { useBookingSession } from '../hooks/useBookingSession';
import { useBookingCountdown } from '../hooks/useBookingCountdown';
import { useBookingConfirm } from '../hooks/useBookingConfirm';
import { BookingSummaryPanel } from './booking-summary-panel';
import { PurchaserForm, type PurchaserFormValues } from './purchaser-form';
import { AgreementSection } from './agreement-section';
import { PaymentCTA } from './payment-cta';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const BookingLayout = () => {
  const router = useRouter();
  const { data: session, isLoading, error } = useBookingSession();
  const { isExpired } = useBookingCountdown(session?.expiresAt);
  const confirmMutation = useBookingConfirm();

  const [agreed, setAgreed] = useState(false);
  const [formValues, setFormValues] = useState<PurchaserFormValues | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleExpire = () => {
    toast.error('선점 시간이 만료되었습니다. 좌석 선택 페이지로 이동합니다.');
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const handleConfirm = () => {
    if (!session || !formValues || !agreed) {
      toast.error('모든 필수 정보를 입력해주세요.');
      return;
    }

    confirmMutation.mutate(
      {
        holdId: session.holdId,
        bookerName: formValues.bookerName,
        bookerEmail: formValues.bookerEmail,
        bookerPhone: formValues.bookerPhone,
        agreedToTerms: agreed,
      },
      {
        onError: (error) => {
          toast.error(extractApiErrorMessage(error, '예매 확정에 실패했습니다.'));
        },
        onSuccess: () => {
          toast.success('예매가 완료되었습니다!');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>
            {extractApiErrorMessage(error, '예매 정보를 불러올 수 없습니다.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const prefillData = useMemo(() => {
    return session.prefillData
      ? {
          bookerName: session.prefillData.name,
          bookerEmail: session.prefillData.email,
          bookerPhone: session.prefillData.phone,
        }
      : undefined;
  }, [session.prefillData]);

  const canConfirm = agreed && isFormValid && formValues && !isExpired;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">예매 정보 입력</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PurchaserForm
            defaultValues={prefillData}
            isLoggedIn={session.isLoggedIn}
            onValuesChange={setFormValues}
            onValidityChange={setIsFormValid}
          >
            {(form) => (
              <>
                <AgreementSection agreed={agreed} onAgreedChange={setAgreed} />
                <input type="submit" className="hidden" />
              </>
            )}
          </PurchaserForm>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <BookingSummaryPanel session={session} onExpire={handleExpire} />
        </div>
      </div>

      <PaymentCTA
        onConfirm={handleConfirm}
        isLoading={confirmMutation.isPending}
        disabled={!canConfirm}
        isExpired={isExpired}
      />
    </div>
  );
};
