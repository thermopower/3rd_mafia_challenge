export const authErrorCodes = {
  invalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  emailExists: 'AUTH_EMAIL_EXISTS',
  weakPassword: 'AUTH_WEAK_PASSWORD',
  invalidEmail: 'AUTH_INVALID_EMAIL',
  userNotFound: 'AUTH_USER_NOT_FOUND',
  signupFailed: 'AUTH_SIGNUP_FAILED',
  loginFailed: 'AUTH_LOGIN_FAILED',
  logoutFailed: 'AUTH_LOGOUT_FAILED',
  sessionError: 'AUTH_SESSION_ERROR',
  validationError: 'AUTH_VALIDATION_ERROR',
} as const;

type AuthErrorValue = (typeof authErrorCodes)[keyof typeof authErrorCodes];

export type AuthServiceError = AuthErrorValue;
