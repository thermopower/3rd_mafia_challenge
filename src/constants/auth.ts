import { match } from "ts-pattern";

const PUBLIC_PATHS = ["/", "/login", "/signup"] as const;
const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/favicon",
  "/static",
  "/docs",
  "/images",
  "/concerts",      // 콘서트 상세 - 비회원 접근 가능 (UC-002)
  "/booking",       // 예약 정보 입력 - 비회원 접근 가능 (UC-006)
  "/reservations",  // 예약 조회 - 비회원 접근 가능 (UC-009)
] as const;

export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const AUTH_ENTRY_PATHS = [LOGIN_PATH, SIGNUP_PATH] as const;
export const isAuthEntryPath = (
  pathname: string
): pathname is (typeof AUTH_ENTRY_PATHS)[number] =>
  AUTH_ENTRY_PATHS.includes(pathname as (typeof AUTH_ENTRY_PATHS)[number]);

export const isAuthPublicPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();

  return match(normalized)
    .when(
      (path) => PUBLIC_PATHS.some((publicPath) => publicPath === path),
      () => true
    )
    .when(
      (path) => PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)),
      () => true
    )
    .otherwise(() => false);
};

export const shouldProtectPath = (pathname: string) => !isAuthPublicPath(pathname);
