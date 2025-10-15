import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  authErrorCodes,
  type AuthServiceError,
} from '@/features/auth/backend/error';
import type {
  AuthResponse,
  LoginRequest,
  LogoutResponse,
  SignupRequest,
} from '@/features/auth/backend/schema';

export const loginWithEmail = async (
  client: SupabaseClient,
  payload: LoginRequest,
): Promise<HandlerResult<AuthResponse, AuthServiceError, unknown>> => {
  const { data, error } = await client.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return failure(
        401,
        authErrorCodes.invalidCredentials,
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return failure(
      500,
      authErrorCodes.loginFailed,
      '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      error.message,
    );
  }

  if (!data.user) {
    return failure(
      401,
      authErrorCodes.userNotFound,
      '사용자 정보를 찾을 수 없습니다.',
    );
  }

  const { data: profile } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', data.user.id)
    .maybeSingle();

  return success({
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      fullName: profile?.full_name ?? null,
    },
    message: '로그인에 성공했습니다.',
  });
};

export const signupWithEmail = async (
  client: SupabaseClient,
  payload: SignupRequest,
): Promise<HandlerResult<AuthResponse, AuthServiceError, unknown>> => {
  const { data, error } = await client.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
        contact_phone: payload.contactPhone,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return failure(
        409,
        authErrorCodes.emailExists,
        '이미 사용 중인 이메일입니다.',
      );
    }

    if (
      error.message.includes('Password') ||
      error.message.includes('weak')
    ) {
      return failure(
        400,
        authErrorCodes.weakPassword,
        '비밀번호가 보안 정책을 만족하지 않습니다.',
      );
    }

    return failure(
      500,
      authErrorCodes.signupFailed,
      '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      error.message,
    );
  }

  if (!data.user) {
    return failure(
      500,
      authErrorCodes.signupFailed,
      '회원가입에 실패했습니다.',
    );
  }

  const { error: profileError } = await client.from('profiles').upsert({
    id: data.user.id,
    full_name: payload.fullName,
    contact_phone: payload.contactPhone ?? null,
  });

  if (profileError) {
    return failure(
      500,
      authErrorCodes.signupFailed,
      '프로필 생성 중 오류가 발생했습니다.',
      profileError.message,
    );
  }

  return success({
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      fullName: payload.fullName,
    },
    message: '회원가입에 성공했습니다.',
  });
};

export const logout = async (
  client: SupabaseClient,
): Promise<HandlerResult<LogoutResponse, AuthServiceError, unknown>> => {
  const { error } = await client.auth.signOut();

  if (error) {
    return failure(
      500,
      authErrorCodes.logoutFailed,
      '로그아웃 중 오류가 발생했습니다.',
      error.message,
    );
  }

  return success({
    message: '로그아웃에 성공했습니다.',
  });
};
