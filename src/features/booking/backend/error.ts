export const bookingErrorCodes = {
  invalidParams: 'BOOKING_INVALID_PARAMS',
  sessionNotFound: 'BOOKING_SESSION_NOT_FOUND',
  sessionExpired: 'BOOKING_SESSION_EXPIRED',
  inputInvalid: 'BOOKING_INPUT_INVALID',
  seatExpired: 'BOOKING_SEAT_EXPIRED',
  alreadyConfirmed: 'BOOKING_ALREADY_CONFIRMED',
  confirmationError: 'BOOKING_CONFIRMATION_ERROR',
  validationError: 'BOOKING_VALIDATION_ERROR',
  fetchError: 'BOOKING_FETCH_ERROR',
  userNotFound: 'BOOKING_USER_NOT_FOUND',
} as const;

export type BookingErrorCode =
  (typeof bookingErrorCodes)[keyof typeof bookingErrorCodes];

export type BookingServiceError = BookingErrorCode;
