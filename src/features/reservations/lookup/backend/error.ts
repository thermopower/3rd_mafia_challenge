export const reservationLookupErrorCodes = {
  validationError: 'RESERVATION_LOOKUP_VALIDATION_ERROR',
  notFound: 'RESERVATION_NOT_FOUND',
  contactMismatch: 'RESERVATION_CONTACT_MISMATCH',
  expired: 'RESERVATION_EXPIRED',
  lookupFailed: 'RESERVATION_LOOKUP_FAILED',
} as const;

type ReservationLookupErrorValue =
  (typeof reservationLookupErrorCodes)[keyof typeof reservationLookupErrorCodes];

export type ReservationLookupServiceError = ReservationLookupErrorValue;
