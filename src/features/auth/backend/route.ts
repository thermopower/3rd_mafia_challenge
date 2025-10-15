import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
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

    const supabase = getSupabase(c);
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

    const supabase = getSupabase(c);
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
    const supabase = getSupabase(c);
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
