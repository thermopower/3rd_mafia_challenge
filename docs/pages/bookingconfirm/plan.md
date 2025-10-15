# UC-008: 예매 완료 페이지 (Booking Confirmation) - 상세 계획

---

## 1. 개요

### 1.1 목적
예매가 성공적으로 완료된 이후 사용자가 결과를 확인하고 다음 행동(예약 조회, 마이페이지 이동, 메인으로 복귀 등)을 선택할 수 있도록 명확하고 신뢰성 있는 확인 화면을 제공한다. 회원/비회원 모두에게 필요한 정보(예매 번호, 공연 정보, 결제 금액, 좌석 내역)를 즉시 노출하며, 비회원의 경우 예매 조회에 필요한 안내를 제공한다.

### 1.2 주요 기능
- 예매 번호 및 주요 공연 정보 요약
- 좌석/결제 금액 세부 내역 리스트
- 회원/비회원 분기에 따른 CTA (마이페이지 / 예매 조회)
- 예매 번호 복사, 알림 메시지, 고객센터 안내
- 예매 확정 시점의 Supabase 데이터와 동기화된 결과 표시

### 1.3 경로 및 범위
- **페이지 경로**: `/bookingconfirm`
- **필수 파라미터**: `orderId` (쿼리/상태 기반 전달)
- **주요 API 엔드포인트**:
  - `GET /api/reservations/:orderId` : 예매 상세 조회
  - `GET /api/reservations/:orderId/tickets` : 좌석/티켓 정보 조회
- **접근 조건**: 예매 완료 직후 리디렉션 또는 orderId가 있는 사용자

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **BookingConfirmationPage** | `src/app/bookingconfirm/page.tsx` | 페이지 엔트리, Suspense/에러 경계 |
| **BookingConfirmationView** | `src/features/booking/confirmation/components/booking-confirmation-view.tsx` | 메인 UI 컨테이너 |
| **ConfirmationHeader** | `src/features/booking/confirmation/components/confirmation-header.tsx` | 성공 아이콘, 제목, 설명 |
| **OrderSummaryCard** | `src/features/booking/confirmation/components/order-summary-card.tsx` | 예매 번호, 복사 버튼 |
| **ConcertInfoCard** | `src/features/booking/confirmation/components/concert-info-card.tsx` | 공연 메타 정보 |
| **TicketList** | `src/features/booking/confirmation/components/ticket-list.tsx` | 좌석/티켓 상세 |
| **NextActionPanel** | `src/features/booking/confirmation/components/next-action-panel.tsx` | CTA 버튼 묶음 |
| **useBookingConfirmation** | `src/features/booking/confirmation/hooks/useBookingConfirmation.ts` | 예매 상세 조회 훅 |
| **useTicketList** | `src/features/booking/confirmation/hooks/useTicketList.ts` | 티켓 목록 훅 |
| **bookingConfirmation/backend/schema** | `src/features/booking/confirmation/backend/schema.ts` | 상세 조회 스키마 |
| **bookingConfirmation/backend/service** | `src/features/booking/confirmation/backend/service.ts` | Supabase 조회 로직 |
| **bookingConfirmation/backend/route** | `src/features/booking/confirmation/backend/route.ts` | `/api/reservations/:orderId` 핸들러 |
| **bookingConfirmation/backend/error** | `src/features/booking/confirmation/backend/error.ts` | 예매 완료 전용 에러 |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "App Router"
        Page[`src/app/bookingconfirm/page.tsx`]
    end

    subgraph "Presentation"
        View[BookingConfirmationView]
        Header[ConfirmationHeader]
        Summary[OrderSummaryCard]
        Concert[ConcertInfoCard]
        Tickets[TicketList]
        NextActions[NextActionPanel]
    end

    subgraph "Hooks"
        ConfirmationHook[useBookingConfirmation]
        TicketHook[useTicketList]
        AuthHook[useCurrentUser]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`booking/confirmation/backend/route.ts`]
        Service[`booking/confirmation/backend/service.ts`]
        Schema[`booking/confirmation/backend/schema.ts`]
        Error[`booking/confirmation/backend/error.ts`]
    end

    subgraph "Database"
        ReservationOrders[(reservation_orders)]
        ReservationSeats[(reservation_order_seats)]
        Concerts[(concerts)]
        ConcertSchedules[(concert_schedules)]
    end

    Page --> View
    View --> Header
    View --> Summary
    View --> Concert
    View --> Tickets
    View --> NextActions

    View --> ConfirmationHook
    Tickets --> TicketHook
    View --> AuthHook

    ConfirmationHook --> ApiClient
    TicketHook --> ApiClient
    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> ReservationOrders
    Service --> ReservationSeats
    Service --> Concerts
    Service --> ConcertSchedules
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `BookingConfirmationPage`
   - `"use client"` 적용, `useSearchParams` 또는 Navigation 상태로 `orderId` 확보.
   - `Suspense` + `ErrorBoundary` 구성하여 데이터 Fetch 분기.
   - `orderId` 없을 경우 `/`로 리다이렉션.
2. `BookingConfirmationView`
   - `useBookingConfirmation` 결과를 받아 구성 요소에 전달.
   - Skeleton → 실제 데이터 → Empty/Error 상태 순서로 렌더링.
   - QA: 로딩 시 shimmer, 오류 시 재시도 버튼 제공.
3. `ConfirmationHeader`
   - 성공 아이콘(`lucide-react`), 제목, 설명 문구.
   - `aria-live="polite"`로 성공 메시지 전달.
4. `OrderSummaryCard`
   - 예매 번호, 결제 시각, 결제 수단 등 핵심 정보.
   - 복사 버튼: `navigator.clipboard.writeText`, Toast 성공 메시지.
5. `ConcertInfoCard`
   - 공연 썸네일( `https://picsum.photos/seed/${concertId}/640/360` ), 공연명, 아티스트, 일정, 공연장.
   - 접근성: 이미지 대체 텍스트, 정보 리스트 구조.
6. `TicketList`
   - 좌석/가격 리스트, 총 결제 금액 강조.
   - 길어질 경우 가상 스크롤 고려, 모바일 1열 정렬.
7. `NextActionPanel`
   - 회원: `마이페이지로 이동`, `메인으로`, `다른 공연 보기`.
   - 비회원: `예매 조회`, `메인으로`.
   - 버튼은 `shadcn-ui` `Button` 사용, `ts-pattern`으로 분기.

### 3.2 Hooks & State
1. `useBookingConfirmation`
   - `useSuspenseQuery(['booking-confirmation', orderId])`.
   - 실패 시 에러를 throw하여 ErrorBoundary 처리, 로그 기록(`AppLogger.error`).
2. `useTicketList`
   - `useQuery` 병렬 호출 또는 `select`로 좌석 리스트 변환.
   - 좌석 정렬(구역>열>번호) 로직 포함.
3. `useCurrentUser`
   - 회원/비회원 판단, CTA 분기 및 안내 메시지에 활용.
4. 전역 상태는 불필요; React Query 캐시로만 관리.

### 3.3 Backend
1. `schema.ts`
   - `bookingConfirmationParamsSchema` (`orderId` 필수, UUID 형식).
   - `bookingConfirmationResponseSchema`: 예매 정보, 공연 정보, 결제 정보, 좌석 배열, `redirectTo`는 `z.string()`.
2. `service.ts`
   - Supabase 조인(`reservation_orders`, `reservation_order_seats`, `concerts`, `concert_schedules`).
   - 비회원 예매 시 이메일/전화번호 마스킹 처리.
   - 예매가 취소 상태면 에러 코드 반환.
3. `route.ts`
   - `app.get('/api/reservations/:orderId', ...)`.
   - 필요 시 `/tickets` 서브 라우트 별도 정의.
   - `success()`, `failure()` 응답 규약 준수.
4. `error.ts`
   - `BOOKING_ORDER_NOT_FOUND`, `BOOKING_ORDER_CANCELLED`, `BOOKING_ORDER_FORBIDDEN` 등 정의.

### 3.4 테스트 & QA
- **Frontend QA**
  - 회원/비회원별 CTA 및 안내 문구 확인.
  - 예매 번호 복사 성공/실패 케이스.
  - 좌석 리스트가 많을 때 스크롤 및 반응형 확인.
- **Backend 단위 테스트**
  - 존재하지 않는 orderId → 404, 취소된 주문 → 409.
  - 데이터 마스킹 로직 검증.
  - Supabase 조인 컬럼 누락 시 에러 핸들링.
- **통합 테스트**
  - `/booking` → `/bookingconfirm` E2E 시나리오.
  - 예매 완료 후 다시 새로고침해도 동일 데이터 확인.

---

## 4. 통합 체크리스트
- [ ] `registerBookingConfirmationRoutes(app)` Hono 등록 (`app.get('/api/reservations/:orderId', ...)`)
- [ ] 모든 컴포넌트에 `"use client"` 지시자 배치
- [ ] API 호출은 `@/lib/remote/api-client` 사용
- [ ] `picsum.photos` placeholder seed 고정으로 캐시 일관성 확보
- [ ] `AppLogger.info/error` 로딩 및 실패 로깅
- [ ] 주문 미존재 시 리디렉션 및 알림 UX 확인

---

## 5. 참고 문서
- `docs/userflow.md` – 플로우 5 (예매 완료/확인)
- `docs/prd.md` – 예매 성공 화면 요구사항
- `docs/state-management.md` – React Query 캐시 전략
- `docs/database.md` – 예매 관련 테이블 정의

---

## 6. 향후 확장 아이디어
- 모바일 티켓 QR 발급 및 지갑 연동 CTA 추가
- 예매 결과 공유 기능(카카오톡/링크)
- 추천 공연/굿즈 모듈 삽입
- 취소/환불 안내 및 버튼 노출 (정책 확정 시)
