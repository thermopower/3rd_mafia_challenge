export const bookingConfirmationErrorCodes = {
  orderNotFound: 'BOOKING_ORDER_NOT_FOUND',
  orderCancelled: 'BOOKING_ORDER_CANCELLED',
  orderExpired: 'BOOKING_ORDER_EXPIRED',
  orderForbidden: 'BOOKING_ORDER_FORBIDDEN',
  fetchError: 'BOOKING_CONFIRMATION_FETCH_ERROR',
  validationError: 'BOOKING_CONFIRMATION_VALIDATION_ERROR',
} as const;

export type BookingConfirmationErrorCode =
  (typeof bookingConfirmationErrorCodes)[keyof typeof bookingConfirmationErrorCodes];
