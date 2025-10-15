export const seatSelectionErrorCodes = {
  // 좌석 조회 관련
  concertNotFound: 'CONCERT_NOT_FOUND',
  seatsNotFound: 'SEATS_NOT_FOUND',
  seatsFetchError: 'SEATS_FETCH_ERROR',

  // 좌석 선점 관련
  seatNotFound: 'SEAT_NOT_FOUND',
  seatAlreadyHeld: 'SEAT_ALREADY_HELD',
  seatSoldOut: 'SEAT_SOLD_OUT',
  maxSeatsExceeded: 'MAX_SEATS_EXCEEDED',
  holdCreationError: 'HOLD_CREATION_ERROR',

  // 좌석 선점 해제 관련
  holdNotFound: 'HOLD_NOT_FOUND',
  holdExpired: 'HOLD_EXPIRED',
  holdReleaseError: 'HOLD_RELEASE_ERROR',

  // 유효성 검증
  validationError: 'VALIDATION_ERROR',
  invalidParams: 'INVALID_PARAMS',
} as const;

type SeatSelectionErrorValue =
  (typeof seatSelectionErrorCodes)[keyof typeof seatSelectionErrorCodes];

export type SeatSelectionServiceError = SeatSelectionErrorValue;
