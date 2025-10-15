import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { Database } from '@/lib/supabase/types';

type HonoContext = Context;

/**
 * Hono Context에서 쿠키를 읽고 쓸 수 있는 Supabase 서버 클라이언트를 생성합니다.
 * 이 클라이언트는 세션을 쿠키에 저장하므로, 인증 엔드포인트에서 사용해야 합니다.
 */
export const createCookieBasedClient = (
  c: HonoContext,
  url: string,
  anonKey: string,
): SupabaseClient<Database> => {
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        // Hono Context에서 모든 쿠키를 가져옵니다
        const cookieHeader = c.req.header('Cookie');
        if (!cookieHeader) return [];

        // 쿠키 문자열을 파싱합니다
        return cookieHeader.split(';').map((cookie) => {
          const [name, ...rest] = cookie.trim().split('=');
          const value = rest.join('=');
          return { name, value };
        });
      },
      setAll(cookiesToSet) {
        // Supabase가 설정하려는 쿠키들을 응답 헤더에 추가합니다
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(c, name, value, {
            path: options?.path ?? '/',
            maxAge: options?.maxAge,
            httpOnly: options?.httpOnly ?? false,
            secure: options?.secure ?? false,
            sameSite: options?.sameSite as 'lax' | 'strict' | 'none' | undefined,
            expires: options?.expires ? new Date(options.expires) : undefined,
          });
        });
      },
    },
  });
};
