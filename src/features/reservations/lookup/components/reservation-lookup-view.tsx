'use client';

import { useState } from 'react';
import { match } from 'ts-pattern';
import { AlertCircle } from 'lucide-react';
import { ReservationLookupForm } from './reservation-lookup-form';
import { ReservationResultCard } from './reservation-result-card';
import { LookupEmptyState } from './lookup-empty-state';
import { useReservationLookup } from '../hooks/useReservationLookup';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type {
  ReservationLookupRequest,
  ReservationLookupResponse,
} from '@/features/reservations/lookup/lib/dto';

type ViewState =
  | { type: 'initial' }
  | { type: 'loading' }
  | { type: 'success'; data: ReservationLookupResponse }
  | { type: 'error'; message: string };

export function ReservationLookupView() {
  const [viewState, setViewState] = useState<ViewState>({ type: 'initial' });
  const { mutateAsync, isPending } = useReservationLookup();

  const handleSubmit = async (data: ReservationLookupRequest) => {
    setViewState({ type: 'loading' });
    try {
      const result = await mutateAsync(data);
      setViewState({ type: 'success', data: result });
    } catch (error) {
      const message = extractApiErrorMessage(
        error,
        '예약 조회에 실패했습니다. 입력하신 정보를 다시 확인해주세요.',
      );
      setViewState({ type: 'error', message });
    }
  };

  const handleReset = () => {
    setViewState({ type: 'initial' });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {match(viewState)
        .with({ type: 'initial' }, () => (
          <>
            <LookupEmptyState />
            <ReservationLookupForm
              onSubmit={handleSubmit}
              isLoading={isPending}
            />
          </>
        ))
        .with({ type: 'loading' }, () => (
          <ReservationLookupForm onSubmit={handleSubmit} isLoading={isPending} />
        ))
        .with({ type: 'success' }, (state) => (
          <ReservationResultCard reservation={state.data} onReset={handleReset} />
        ))
        .with({ type: 'error' }, (state) => (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>조회 실패</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
            <ReservationLookupForm
              onSubmit={handleSubmit}
              isLoading={isPending}
            />
          </>
        ))
        .exhaustive()}
    </div>
  );
}
