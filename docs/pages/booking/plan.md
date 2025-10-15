# UC-006/UC-007: 예매 정보 입력 페이지 - 상세 계획

> **통합 범위**
> - **UC-006**: 비회원 예매 정보 입력
> - **UC-007**: 회원 예매 정보 확인 및 입력

---

## 1. 개요

### 1.1 목적
좌석 선점이 완료된 이후 결제에 필요한 구매자 정보를 수집·검증하고 예매를 확정하기 위한 마지막 단계를 제공한다. 회원은 저장된 정보를 불러와 빠르게 확인하고, 비회원은 필수 정보를 신규 입력하여 좌석 선점 만료 시간 안에 예매를 마칠 수 있도록 한다.

### 1.2 주요 기능
- 선점 좌석/결제 금액/만료 타이머 실시간 표시
- 회원 자동 완성 및 비회원 신규 입력 폼
- 개인정보·연락처 검증과 약관 동의 수집
- 예매 사전 검증 및 확정 API 연동
- 타이머 만료 및 오류 처리 UI/UX 가이드

### 1.3 경로 및 범위
- **페이지 경로**: `/booking`
- **선행 단계**: 좌석 선택 → 좌석 선점 성공 (`/concerts/[id]/seats`)
- **주요 API 엔드포인트**:
  - `GET /api/reservations/current` : 현재 선점 정보 조회
  - `POST /api/reservations/preview` : 입력 데이터 검증 및 예매 가능 여부 확인
  - `POST /api/reservations/confirm` : 예매 확정
- **권한 요구**: 로그인 사용자/비로그인 사용자 모두 접근 (선점 토큰 필수)

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **BookingPage** | `src/app/booking/page.tsx` | 페이지 엔트리, Suspense 경계와 레이아웃 래퍼 |
| **BookingLayout** | `src/features/booking/components/booking-layout.tsx` | 최상위 래핑, 좌/우 영역 배치 및 반응형 처리 |
| **BookingSummaryPanel** | `src/features/booking/components/booking-summary-panel.tsx` | 선점 좌석/금액/타이머 요약 영역 |
| **BookingTimerBadge** | `src/features/booking/components/booking-timer-badge.tsx` | 남은 시간 시각화, 만료 시 콜백 처리 |
| **PurchaserForm** | `src/features/booking/components/purchaser-form.tsx` | 회원/비회원 공용 입력 폼, `react-hook-form` |
| **AgreementSection** | `src/features/booking/components/agreement-section.tsx` | 필수 약관 동의 UI |
| **PaymentCTA** | `src/features/booking/components/payment-cta.tsx` | 예매 확정 버튼 및 상태 표시 |
| **useBookingSession** | `src/features/booking/hooks/useBookingSession.ts` | `GET /api/reservations/current` 조회 훅 |
| **useBookingPreview** | `src/features/booking/hooks/useBookingPreview.ts` | 예매 사전 검증 Mutation |
| **useBookingConfirm** | `src/features/booking/hooks/useBookingConfirm.ts` | 예매 확정 Mutation |
| **useBookingCountdown** | `src/features/booking/hooks/useBookingCountdown.ts` | 만료 타이머 관리(`react-use`, `date-fns`) |
| **booking/backend/schema** | `src/features/booking/backend/schema.ts` | 요청/응답 Zod 스키마 정의 |
| **booking/backend/service** | `src/features/booking/backend/service.ts` | Supabase 쿼리 및 비즈니스 로직 |
| **booking/backend/route** | `src/features/booking/backend/route.ts` | Hono 라우터 (`/api/reservations/*`) |
| **booking/backend/error** | `src/features/booking/backend/error.ts` | 오류 코드/메시지 상수 |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "App Router"
        Page[`src/app/booking/page.tsx`]
    end

    subgraph "Presentation"
        Layout[BookingLayout]
        Summary[BookingSummaryPanel]
        Timer[BookingTimerBadge]
        Form[PurchaserForm]
        Agreement[AgreementSection]
        CTA[PaymentCTA]
    end

    subgraph "Hooks"
        SessionHook[useBookingSession]
        PreviewHook[useBookingPreview]
        ConfirmHook[useBookingConfirm]
        CountdownHook[useBookingCountdown]
        AuthHook[useCurrentUser]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`booking/backend/route.ts`]
        Service[`booking/backend/service.ts`]
        Schema[`booking/backend/schema.ts`]
        Error[`booking/backend/error.ts`]
    end

    subgraph "Database"
        ReservationOrders[(reservation_orders)]
        ReservationSeats[(reservation_order_seats)]
        ConcertSchedules[(concert_schedules)]
        Users[(users)]
    end

    Page --> Layout
    Layout --> Summary
    Layout --> Form
    Layout --> Agreement
    Layout --> CTA
    Summary --> Timer

    Layout --> SessionHook
    Summary --> SessionHook
    Timer --> CountdownHook
    Form --> PreviewHook
    CTA --> ConfirmHook
    Form --> AuthHook

    SessionHook --> ApiClient
    PreviewHook --> ApiClient
    ConfirmHook --> ApiClient
    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> ReservationOrders
    Service --> ReservationSeats
    Service --> ConcertSchedules
    Service --> Users
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `BookingPage`
   - `"use client"` 적용, React Query `Hydrate` 래핑으로 CSR 구성.
   - `Suspense` + `ErrorBoundary` 조합으로 데이터 로딩/에러 분기.
   - QA: 선점 정보 없음 시 `/concerts/[id]`로 리다이렉션.
2. `BookingLayout`
   - Tailwind 기반 2열 레이아웃(Desktop)/Stack(Mobile) 지원.
   - `ts-pattern`으로 상태(로딩/에러/정상) 분기.
   - QA: 최소 너비 320px, 포커스 이동 흐름 확인.
3. `BookingSummaryPanel`
   - 좌석 카드, 총액 표기, `picsum.photos/seed/{concertId}/320/200` 썸네일.
   - 좌석 리스트 가로 스크롤 + 배지(`lucide-react`) 표시.
   - QA: 타이머 만료 시 UI 잠금, Skeleton/Empty 상태 검증.
4. `PurchaserForm`
   - `react-hook-form` + `zodResolver`, 회원 정보 Prefill.
   - 입력 항목: 이름, 이메일, 전화번호, 생년월일 등 PRD 기준 필드.
   - QA: 필수 필드 공백/포맷 검증, 스크린리더 대응.
5. `AgreementSection`
   - 필수/선택 약관 체크박스 분리, Dialog로 전문 제공.
   - QA: 필수 체크 미완료 시 CTA 비활성화 및 경고 문구.
6. `PaymentCTA`
   - `useBookingPreview` 선검증 → 성공 시 `useBookingConfirm` 실행.
   - Mutation 진행 중 로딩 상태, `aria-live`로 피드백 제공.
   - 실패 유형별 토스트(좌석 만료, 정보 불일치 등) 노출.

### 3.2 Hooks & State
1. `useBookingSession`
   - `useSuspenseQuery(['booking-session'])`로 현재 선점 정보 Fetch.
   - 실패 시 로그(`AppLogger.error`) 및 `/`로 이동 유도.
2. `useBookingCountdown`
   - `react-use` `useInterval` 활용, `date-fns/differenceInSeconds`.
   - 남은 시간 0초 이하 시 전역 상태(Zustand) 업데이트 → 모달 오픈.
3. `useBookingPreview`
   - `useMutation`으로 사전 검증 호출, 입력 데이터 Zod 스키마 직렬화.
   - 성공 시 검증 결과 캐시 저장하여 재사용.
4. `useBookingConfirm`
   - 예매 확정 성공 시 `/bookingconfirm?orderId=`로 라우팅.
   - React Query 캐시 무효화(`reservations`, `mypage`) 처리.

### 3.3 Backend
1. `schema.ts`
   - `bookingPreviewRequestSchema`, `bookingConfirmRequestSchema` 정의.
   - 응답 스키마에 `redirectTo`는 `z.string()` 사용 (상대 경로 허용).
2. `service.ts`
   - 선점 유효성 검증: 만료 시간 비교, 좌석 상태 확인.
   - 회원: `users` 테이블 조인으로 기본 정보 반환.
   - 비회원: 필요 시 임시 레코드 생성, 트랜잭션 사용.
3. `route.ts`
   - `app.get('/api/reservations/current', ...)`
   - `app.post('/api/reservations/preview', ...)`
   - `app.post('/api/reservations/confirm', ...)`
   - 모든 응답은 `success()/failure()` 포맷으로 통일.
4. `error.ts`
   - `BOOKING_SESSION_NOT_FOUND`, `BOOKING_INPUT_INVALID`, `BOOKING_SEAT_EXPIRED`, `BOOKING_ALREADY_CONFIRMED`.
   - Hono 미들웨어에서 `failure()`와 매핑.

### 3.4 테스트 & QA
- **Frontend QA**
  - 회원/비회원 시나리오 각각 폼 검증.
  - 타이머 만료 시 안내 모달 및 선점 해제 확인.
  - API 오류(400/409/500) 시 사용자 메시지 검증.
- **Backend 단위 테스트 (Vitest)**
  - 좌석 만료 로직, 선점 중복 검증, 입력 Validation.
  - 비회원 생성/기존 회원 병행 시나리오.
- **통합 테스트**
  - `/booking` → `/bookingconfirm` 플로우 E2E 체크 (Playwright).
  - React Query 캐시 상태 점검 (`state-management.md` 가이드 준수).

---

## 4. 통합 체크리스트
- [ ] `registerBookingRoutes(app)`를 `src/backend/hono/app.ts`에 등록
- [ ] 모든 컴포넌트 최상단 `"use client"` 명시
- [ ] HTTP 호출은 `@/lib/remote/api-client` 단일 경로 사용
- [ ] `picsum.photos` placeholder URL seed 고정
- [ ] 만료 타이머와 모달 접근성(`aria-live`, focus trap) 확인
- [ ] 성공 시 `/bookingconfirm`로 Navigation & Toast 동작 확인

---

## 5. 참고 문서
- `docs/userflow.md` – 플로우 3·4 단계 (좌석 선택 → 정보 입력)
- `docs/prd.md` – 예매 단계별 요구사항 및 예외 케이스
- `docs/state-management.md` – React Query & Zustand 연계 가이드
- `docs/database.md` – `reservation_orders` 관련 스키마

---

## 6. 향후 확장 아이디어
- 간편 결제(카카오·네이버페이) 연동을 위한 Payment Provider 추상화
- 실시간 상담/문의 CTA 삽입 및 WebSocket 대기열 확인
- RCI(Remember Customer Info) 토글 제공으로 개인정보 자동 저장 제어
- 약관 다국어 및 버전 히스토리 관리
