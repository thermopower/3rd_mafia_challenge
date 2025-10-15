export const homeErrorCodes = {
  fetchError: 'HOME_FETCH_ERROR',
  validationError: 'HOME_VALIDATION_ERROR',
  invalidFilter: 'HOME_INVALID_FILTER',
  concertNotFound: 'HOME_CONCERT_NOT_FOUND',
} as const;

export type HomeServiceError =
  (typeof homeErrorCodes)[keyof typeof homeErrorCodes];
