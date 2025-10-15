# 로그인 페이지 - 상세 계획

---

## 1. 개요

### 1.1 목적
사용자가 이메일과 비밀번호를 입력하여 인증할 수 있는 독립된 로그인 페이지를 제공한다. 로그인 성공 후 이전 페이지 또는 메인 페이지로 리다이렉트하며, Supabase Auth와 연동한다.

### 1.2 주요 기능
- 이메일/비밀번호 입력 및 검증
- 로그인 실패 시 에러 메시지 표시
- 회원가입 페이지로 이동 링크
- 비밀번호 찾기/재설정 링크
- redirectedFrom 쿼리 파라미터를 통한 리다이렉트 처리

### 1.3 접근 경로
- 헤더의 로그인 버튼 클릭 시
- 로그인이 필요한 기능(찜하기, 마이페이지 등) 접근 시 자동 리다이렉트
- `/login` 직접 접근
- 이미 로그인된 사용자는 메인 페이지로 리다이렉트

### 1.4 관련 API
- `POST /api/auth/login`
- Supabase Auth SDK(`@supabase/supabase-js`) service-role 연동은 백엔드에서 처리

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **LoginPage** | `src/app/login/page.tsx` | 로그인 페이지 컴포넌트 |
| **PageLoginForm** | `src/features/auth/components/page-login-form.tsx` | 로그인 폼 컴포넌트 |
| **useLoginMutation** | `src/features/auth-modal/hooks/useLoginMutation.ts` | 로그인 API Mutation (재사용) |
| **auth/backend/schema** | `src/features/auth/backend/schema.ts` | 로그인 요청 스키마 |
| **auth/backend/service** | `src/features/auth/backend/service.ts` | Supabase Auth 연동 서비스 |
| **auth/backend/route** | `src/features/auth/backend/route.ts` | `/api/auth/login` 라우터 |

### 2.2 페이지 구조
```
/login 페이지
├── 로고/타이틀
├── 로그인 폼
│   ├── 이메일 입력
│   ├── 비밀번호 입력
│   └── 로그인 버튼
├── 하단 링크
│   ├── 회원가입 링크 → /signup
│   └── 비밀번호 찾기 (향후 구현)
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. **LoginPage** (`src/app/login/page.tsx`)
   - `"use client"` 선언
   - 로그인 상태 확인: 이미 로그인된 경우 리다이렉트
   - `redirectedFrom` 쿼리 파라미터 추출하여 PageLoginForm에 전달
   - 중앙 정렬된 카드 레이아웃

2. **PageLoginForm** (`src/features/auth/components/page-login-form.tsx`)
   - `react-hook-form` + `zodResolver`로 이메일/비밀번호 유효성 검사
   - 제출 시 `useLoginMutation` 호출
   - 성공 시:
     - `useCurrentUser().refresh()` 호출하여 사용자 정보 갱신
     - Toast 메시지 표시
     - `redirectedFrom` 또는 메인 페이지(`/`)로 리다이렉트
   - 실패 시 오류 메시지 표시 (존재하지 않는 계정, 비밀번호 오류 등)

### 3.2 Hooks & State
1. **useLoginMutation** (기존 재사용)
   - `useMutation`으로 `/api/auth/login` 호출
   - 성공 시 `queryClient.invalidateQueries(['current-user'])`
   - 실패 시 `AppLogger.warn` 기록

### 3.3 Routing & Navigation
1. **로그인 필요 시 리다이렉트**
   ```typescript
   // 예: 찜하기 버튼 클릭 시
   if (!isAuthenticated) {
     router.push(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
   }
   ```

2. **로그인 성공 후 리다이렉트**
   ```typescript
   const redirectTo = searchParams.get("redirectedFrom") ?? "/";
   router.push(redirectTo);
   ```

### 3.4 Styling
- 카드 기반 중앙 정렬 레이아웃
- 반응형 디자인 (모바일/데스크톱)
- shadcn-ui Card, Input, Button 컴포넌트 활용
- 최소 높이 설정하여 폼이 화면 중앙에 위치

### 3.5 테스트 & QA
- **Frontend QA**
  - 이메일 형식 검증
  - 비밀번호 길이 검증
  - 잘못된 자격 증명 시 오류 메시지
  - 이미 로그인된 사용자 리다이렉트
  - redirectedFrom 파라미터 처리
  - 모바일 반응형 레이아웃
- **통합 테스트**
  - 로그인 → 이전 페이지 복귀 흐름
  - 회원가입 링크 → 회원가입 페이지 이동

---

## 4. 통합 체크리스트
- [ ] `PageLoginForm` 컴포넌트 생성
- [ ] `src/app/login/page.tsx` 페이지 구현
- [ ] 모든 컴포넌트 `"use client"` 선언
- [ ] API 호출은 `@/lib/remote/api-client` 사용
- [ ] 성공/실패 로깅은 `AppLogger.info/error` 이용
- [ ] redirectedFrom 쿼리 파라미터 처리
- [ ] 회원가입 페이지 링크 연결
- [ ] 접근성(A11y) 테스트: 포커스, `aria-label`, 에러 메시지 연결

---

## 5. 참고 문서
- `docs/userflow.md` – 유저플로우 4: 로그인 (페이지)
- `docs/prd.md` – 인증 관련 요구사항
- `docs/state-management.md` – React Query + Zustand 연동
- `docs/database.md` – 사용자 스키마 참고

---

## 6. 향후 확장 아이디어
- 소셜 로그인 버튼 추가 (카카오, 구글)
- 이메일 인증(OTP) 단계 추가
- Remember Me 체크박스
- 실패 횟수에 따른 CAPTCHA 적용
