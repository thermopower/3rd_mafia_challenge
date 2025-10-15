'use client';

import { CheckCircle2 } from 'lucide-react';

export const ConfirmationHeader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <CheckCircle2
        className="mb-4 text-green-500"
        size={64}
        aria-hidden="true"
      />
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        예매가 완료되었습니다
      </h1>
      <p
        className="text-gray-600"
        aria-live="polite"
      >
        예매 정보를 확인해 주세요.
      </p>
    </div>
  );
};
