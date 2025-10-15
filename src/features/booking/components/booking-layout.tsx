'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useBooking } from '@/features/common/contexts/booking-context';
import { useBookingCountdown } from '../hooks/useBookingCountdown';
import { BookingSummaryPanel } from './booking-summary-panel';
import { PurchaserForm, type PurchaserFormValues } from './purchaser-form';
import { AgreementSection } from './agreement-section';
import { PaymentCTA } from './payment-cta';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const BookingLayout = () => {
  const router = useRouter();
  const { state, fetchBookingSession, confirmBooking } = useBooking();
  const { isExpired } = useBookingCountdown(state.bookingSession?.expiresAt);

  const [agreed, setAgreed] = useState(false);
  const [formValues, setFormValues] = useState<PurchaserFormValues | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    fetchBookingSession(state.holdInfo?.holdId);
  }, [fetchBookingSession, state.holdInfo?.holdId]);

  const handleExpire = () => {
    toast.error('선점 시간이 만료되었습니다. 좌석 선택 페이지로 이동합니다.');
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const handleConfirm = async () => {
    if (!state.bookingSession || !formValues || !agreed) {
      toast.error('모든 필수 정보를 입력해주세요.');
      return;
    }

    try {
      await confirmBooking({
        holdId: state.bookingSession.holdId,
        bookerName: formValues.bookerName,
        bookerEmail: formValues.bookerEmail,
        bookerPhone: formValues.bookerPhone,
        agreedToTerms: agreed,
      });

      toast.success('예매가 완료되었습니다!');
      router.push('/booking/confirmation');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '예매 확정에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  if (state.status === 'loading' && !state.bookingSession) {
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

  if (state.status === 'error' || !state.bookingSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>
            {state.error || '예매 정보를 불러올 수 없습니다.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const prefillData = state.bookingSession.prefillData
    ? {
        bookerName: state.bookingSession.prefillData.name,
        bookerEmail: state.bookingSession.prefillData.email,
        bookerPhone: state.bookingSession.prefillData.phone,
      }
    : undefined;

  const canConfirm = agreed && isFormValid && formValues && !isExpired;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">예매 정보 입력</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PurchaserForm
            defaultValues={prefillData}
            isLoggedIn={state.bookingSession.isLoggedIn}
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
          <BookingSummaryPanel session={state.bookingSession} onExpire={handleExpire} />
        </div>
      </div>

      <PaymentCTA
        onConfirm={handleConfirm}
        isLoading={state.status === 'confirming'}
        disabled={!canConfirm}
        isExpired={isExpired}
      />
    </div>
  );
};
