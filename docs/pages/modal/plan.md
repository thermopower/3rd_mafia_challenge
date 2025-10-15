# UC-004: 로그인/회원가입 공용 모달 - 상세 계획

---

## 1. 개요

### 1.1 목적
찜, 예매, 마이페이지 등 회원 전용 기능을 이용하려는 사용자가 별도의 페이지 이동 없이 현재 위치에서 즉시 인증 플로우를 진행할 수 있도록 모달 기반 UI를 제공한다. 이메일 기반 로그인/회원가입, 비밀번호 재설정 진입을 지원하며 Supabase Auth와 연동한다.

### 1.2 주요 기능
- 로그인/회원가입 탭 전환 UI
- 이메일/비밀번호 입력 및 검증
- 소셜 로그인(확장 시 고려) 버튼 영역
- 비밀번호 찾기/재설정 링크
- 인증 성공 후 현재 페이지 상태 업데이트 및 모달 닫기

### 1.3 사용 위치
- 찜 버튼 클릭 시 로그인 필요 상황
- 좌석 선택/예매 정보 입력 단계에서 인증 요청 필요 시
- 헤더의 로그인 버튼 클릭 시

### 1.4 관련 API
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/logout`
- Supabase Auth SDK(`@supabase/supabase-js`) service-role 연동은 백엔드에서 처리

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **AuthModalProvider** | `src/features/auth-modal/components/auth-modal-provider.tsx` | 전역 모달 상태/포털 관리 |
| **AuthModal** | `src/features/auth-modal/components/auth-modal.tsx` | 모달 컨테이너, 탭/레이아웃 |
| **LoginForm** | `src/features/auth-modal/components/login-form.tsx` | 로그인 폼 (`react-hook-form`) |
| **SignupForm** | `src/features/auth-modal/components/signup-form.tsx` | 회원가입 폼 |
| **AuthFormFooter** | `src/features/auth-modal/components/auth-form-footer.tsx` | 하단 링크/가이드 |
| **useAuthModal** | `src/features/auth-modal/hooks/useAuthModal.ts` | Zustand 기반 모달 상태 훅 |
| **useLoginMutation** | `src/features/auth-modal/hooks/useLoginMutation.ts` | 로그인 API Mutation |
| **useSignupMutation** | `src/features/auth-modal/hooks/useSignupMutation.ts` | 회원가입 API Mutation |
| **auth/backend/schema** | `src/features/auth/backend/schema.ts` | 로그인/회원가입 요청 스키마 |
| **auth/backend/service** | `src/features/auth/backend/service.ts` | Supabase Auth 연동 서비스 |
| **auth/backend/route** | `src/features/auth/backend/route.ts` | `/api/auth/*` 라우터 |
| **auth/backend/error** | `src/features/auth/backend/error.ts` | 인증 관련 에러 정의 |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "UI"
        Provider[AuthModalProvider]
        Modal[AuthModal]
        Login[LoginForm]
        Signup[SignupForm]
        Footer[AuthFormFooter]
    end

    subgraph "Hooks"
        ModalHook[useAuthModal]
        LoginMut[useLoginMutation]
        SignupMut[useSignupMutation]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`auth/backend/route.ts`]
        Service[`auth/backend/service.ts`]
        Schema[`auth/backend/schema.ts`]
        Error[`auth/backend/error.ts`]
    end

    subgraph "Supabase"
        Auth[(Supabase Auth)]
    end

    Provider --> Modal
    Modal --> Login
    Modal --> Signup
    Modal --> Footer

    Modal --> ModalHook
    Login --> LoginMut
    Signup --> SignupMut

    LoginMut --> ApiClient
    SignupMut --> ApiClient
    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> Auth
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `AuthModalProvider`
   - `"use client"` 선언, `Dialog` 컴포넌트(shadcn-ui) 감싸기.
   - Context를 통해 어디서든 `openModal('login'|'signup')` 호출 가능.
2. `AuthModal`
   - `Dialog` 내 탭 구조 생성 (`Tabs` 컴포넌트).
   - 상단에 타이틀/설명, 본문에 폼 삽입, 하단에 안내 및 지침.
   - Esc 키/배경 클릭 시 닫힘, 포커스 트랩 유지.
3. `LoginForm`
   - `react-hook-form` + `zodResolver`로 이메일/비밀번호 유효성 검사.
   - 제출 시 `useLoginMutation` 호출, 성공 시 모달 닫고 Toast.
   - 실패 시 오류 메시지 세분화(존재하지 않는 계정, 비밀번호 오류 등).
4. `SignupForm`
   - 이름, 이메일, 비밀번호, 비밀번호 확인, 이용 약관 동의 체크.
   - 비밀번호 정책(8자 이상, 숫자/특수문자 포함) PRD 기반.
   - 성공 시 자동 로그인 여부 (`docs/prd.md` 참고) 반영.
5. `AuthFormFooter`
   - 비밀번호 재설정 링크(향후 이메일 전송), 고객센터 안내.
   - 소셜 로그인 버튼 영역(placeholder) 제공.

### 3.2 Hooks & State
1. `useAuthModal`
   - Zustand 스토어로 `isOpen`, `mode`, `pendingRedirect` 관리.
   - 모달 닫힐 때 상태 초기화.
2. `useLoginMutation`
   - `useMutation`으로 `/api/auth/login` 호출.
   - 성공 시 `queryClient.invalidateQueries(['current-user'])`.
   - 실패 시 `AppLogger.warn` 기록 및 토스트 메시지.
3. `useSignupMutation`
   - `/api/auth/signup` 호출, 성공 후 자동 로그인 또는 전환 안내.
   - 중복 이메일, 비밀번호 정책 위반 처리.

### 3.3 Backend
1. `schema.ts`
   - 로그인/회원가입 요청 스키마 (`email`, `password`, `name` 등).
   - 응답 스키마: 인증 토큰 대신 세션 쿠키(Next.js Route Handler) 기반.
2. `service.ts`
   - Supabase Auth `signInWithPassword`, `signUp` 래핑.
   - 에러 코드 매핑: `AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_EXISTS`.
3. `route.ts`
   - `app.post('/api/auth/login', ...)`
   - `app.post('/api/auth/signup', ...)`
   - `app.post('/api/auth/logout', ...)`
   - 공통 에러 핸들러, `success()/failure()` 사용.
4. `error.ts`
   - 인증 관련 사용자 친화 메시지 정의.

### 3.4 테스트 & QA
- **Frontend QA**
  - 이메일 형식/비밀번호 길이 검증.
  - 잘못된 자격 증명 시 오류 메시지.
  - 모달 오픈 시 포커스, Esc 닫힘, 모바일 반응형.
- **Backend 단위 테스트**
  - 로그인 실패/성공, 회원가입 중복 계정 시나리오.
  - Supabase 오류 매핑 검증.
- **통합 테스트**
  - 찜 버튼 클릭 → 모달 → 로그인 → 찜 성공 흐름.
  - 회원가입 후 자동 로그인 동작 확인.

---

## 4. 통합 체크리스트
- [ ] `AuthModalProvider`를 `src/app/layout.tsx` 상단에 배치
- [ ] 모든 컴포넌트 `"use client"` 선언
- [ ] API 호출은 `@/lib/remote/api-client` 사용
- [ ] 성공/실패 로깅은 `AppLogger.info/error` 이용
- [ ] Supabase 세션 쿠키 업데이트 후 React Query 캐시 무효화
- [ ] 접근성(A11y) 테스트: 포커스 트랩, `aria-label`, 에러 메시지 연결

---

## 5. 참고 문서
- `docs/userflow.md` – 로그인 필요 분기 흐름
- `docs/prd.md` – 인증 관련 요구사항
- `docs/state-management.md` – React Query + Zustand 연동
- `docs/database.md` – 사용자 스키마 참고

---

## 6. 향후 확장 아이디어
- 소셜 로그인 버튼 실제 연동 (카카오, 구글)
- 이메일 인증(OTP) 단계 추가
- 브라우저 `Passkey`/FIDO2 로그인 지원
- 실패 횟수에 따른 CAPTCHA 적용
