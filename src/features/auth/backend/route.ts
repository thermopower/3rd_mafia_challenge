import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getConfig,
  type AppEnv,
} from '@/backend/hono/context';
import { createCookieBasedClient } from '@/backend/supabase/cookie-client';
import {
  LoginRequestSchema,
  SignupRequestSchema,
} from '@/features/auth/backend/schema';
import {
  loginWithEmail,
  logout,
  signupWithEmail,
} from '@/features/auth/backend/service';
import {
  authErrorCodes,
  type AuthServiceError,
} from '@/features/auth/backend/error';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json();
    const parsedBody = LoginRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          '입력값이 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    // 인증 엔드포인트에서는 쿠키 기반 클라이언트를 사용하여 세션을 저장합니다
    const config = getConfig(c);
    const supabase = createCookieBasedClient(
      c,
      config.supabase.url,
      // 로그인은 anon key를 사용해야 합니다 (service role이 아님)
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const logger = getLogger(c);

    const result = await loginWithEmail(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthServiceError, unknown>;
      logger.warn('Login failed', {
        code: errorResult.error.code,
        email: parsedBody.data.email,
      });
    } else {
      logger.info('Login successful', { email: parsedBody.data.email });
    }

    return respond(c, result);
  });

  app.post('/api/auth/signup', async (c) => {
    const body = await c.req.json();
    const parsedBody = SignupRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          '입력값이 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    // 인증 엔드포인트에서는 쿠키 기반 클라이언트를 사용하여 세션을 저장합니다
    const config = getConfig(c);
    const supabase = createCookieBasedClient(
      c,
      config.supabase.url,
      // 회원가입도 anon key를 사용해야 합니다 (service role이 아님)
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const logger = getLogger(c);

    const result = await signupWithEmail(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthServiceError, unknown>;
      logger.warn('Signup failed', {
        code: errorResult.error.code,
        email: parsedBody.data.email,
      });
    } else {
      logger.info('Signup successful', { email: parsedBody.data.email });
    }

    return respond(c, result);
  });

  app.post('/api/auth/logout', async (c) => {
    // 로그아웃도 쿠키 기반 클라이언트를 사용하여 세션 쿠키를 삭제합니다
    const config = getConfig(c);
    const supabase = createCookieBasedClient(
      c,
      config.supabase.url,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const logger = getLogger(c);

    const result = await logout(supabase);

    if (!result.ok) {
      logger.warn('Logout failed');
    } else {
      logger.info('Logout successful');
    }

    return respond(c, result);
  });
};
