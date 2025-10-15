export const concertDetailErrorCodes = {
  fetchError: "CONCERT_DETAIL_FETCH_ERROR",
  notFound: "CONCERT_NOT_FOUND",
  validationError: "CONCERT_DETAIL_VALIDATION_ERROR",
  metricsError: "CONCERT_METRICS_ERROR",
} as const;

export type ConcertDetailServiceError =
  (typeof concertDetailErrorCodes)[keyof typeof concertDetailErrorCodes];
