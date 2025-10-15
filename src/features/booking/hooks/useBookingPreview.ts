'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  BookingPreviewResponseSchema,
  type BookingPreviewRequest,
  type BookingPreviewResponse,
} from '../lib/dto';

const previewBooking = async (
  request: BookingPreviewRequest,
): Promise<BookingPreviewResponse> => {
  const { data } = await apiClient.post('/api/reservations/preview', request);

  const parsed = BookingPreviewResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid preview response');
  }

  return parsed.data;
};

export const useBookingPreview = () => {
  return useMutation({
    mutationFn: previewBooking,
  });
};
