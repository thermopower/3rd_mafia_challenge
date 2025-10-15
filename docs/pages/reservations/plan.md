# UC-009: 예약 조회 페이지 (비회원/회원 공용) - 상세 계획

---

## 1. 개요

### 1.1 목적
예매 완료 후 예약 번호와 연락처를 기반으로 예매 상태를 확인하려는 사용자(특히 비회원)를 위해 간단한 조회 폼과 결과 화면을 제공한다. 입력 검증, 결과 표시, 오류 안내까지 단일 페이지에서 처리하여 고객센터 부담을 줄인다.

### 1.2 주요 기능
- 예약 번호 + 연락처 기반 조회 폼
- 입력값 유효성 검사 및 오류 메시지
- 예약 상태/공연 정보/좌석 상세 결과 표시
- 결과 미존재, 취소, 만료 등 예외 케이스 메시지
- 예매 번호 복사, 마이페이지 이동(회원), 다시 조회하기 링크

### 1.3 경로 및 범위
- **페이지 경로**: `/reservations/lookup`
- **주요 API 엔드포인트**:
  - `POST /api/reservations/lookup` : 예약 조회
- **접근 권한**: 모든 사용자 가능 (로그인 여부 무관)
- **필수 입력**: 예약 번호, 예약자 전화번호(또는 이메일) – PRD 기준

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **ReservationLookupPage** | `src/app/reservations/lookup/page.tsx` | 페이지 엔트리 |
| **ReservationLookupView** | `src/features/reservations/lookup/components/reservation-lookup-view.tsx` | 전체 레이아웃 |
| **ReservationLookupForm** | `src/features/reservations/lookup/components/reservation-lookup-form.tsx` | 입력 폼 |
| **ReservationResultCard** | `src/features/reservations/lookup/components/reservation-result-card.tsx` | 조회 결과 |
| **ReservationStatusBadge** | `src/features/reservations/lookup/components/reservation-status-badge.tsx` | 상태 배지 |
| **LookupEmptyState** | `src/features/reservations/lookup/components/lookup-empty-state.tsx` | 초기/미조회 상태 |
| **useReservationLookup** | `src/features/reservations/lookup/hooks/useReservationLookup.ts` | Mutation 훅 |
| **reservationsLookup/backend/schema** | `src/features/reservations/lookup/backend/schema.ts` | 요청/응답 스키마 |
| **reservationsLookup/backend/service** | `src/features/reservations/lookup/backend/service.ts` | Supabase 조회 로직 |
| **reservationsLookup/backend/route** | `src/features/reservations/lookup/backend/route.ts` | `/api/reservations/lookup` |
| **reservationsLookup/backend/error** | `src/features/reservations/lookup/backend/error.ts` | 에러 코드 |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "App Router"
        Page[`src/app/reservations/lookup/page.tsx`]
    end

    subgraph "Presentation"
        View[ReservationLookupView]
        Form[ReservationLookupForm]
        Result[ReservationResultCard]
        Status[ReservationStatusBadge]
        Empty[LookupEmptyState]
    end

    subgraph "Hooks"
        LookupHook[useReservationLookup]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`reservations/lookup/backend/route.ts`]
        Service[`reservations/lookup/backend/service.ts`]
        Schema[`reservations/lookup/backend/schema.ts`]
        Error[`reservations/lookup/backend/error.ts`]
    end

    subgraph "Database"
        ReservationOrders[(reservation_orders)]
        ReservationSeats[(reservation_order_seats)]
        Concerts[(concerts)]
        Users[(users)]
    end

    Page --> View
    View --> Form
    View --> Empty
    View --> Result
    Result --> Status

    Form --> LookupHook
    LookupHook --> ApiClient
    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> ReservationOrders
    Service --> ReservationSeats
    Service --> Concerts
    Service --> Users
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `ReservationLookupPage`
   - `"use client"` 선언.
   - 페이지 진입 시 초기 상태 `LookupEmptyState` 표시.
2. `ReservationLookupView`
   - 중앙 정렬 카드 레이아웃(최대 폭 560px).
   - `ts-pattern`으로 초기/조회 중/성공/실패 상태 분기.
3. `ReservationLookupForm`
   - `react-hook-form` + `zodResolver`.
   - 필드: 예약 번호(영문+숫자 12~16자), 연락처(숫자/`-` 허용).
   - 제출 시 `useReservationLookup` Mutation 실행.
   - 에러 메시지는 필드 하단/Toast 병행.
4. `ReservationResultCard`
   - 공연 썸네일(`https://picsum.photos/seed/${orderId}/320/200`), 공연명, 일정, 좌석 리스트, 결제 금액, 상태 배지.
   - CTA: `마이페이지로 이동` (회원), `새 창에서 티켓 보기`, `다시 조회`.
5. `ReservationStatusBadge`
   - 상태(`COMPLETED`, `CANCELLED`, `PENDING`)를 색상/아이콘으로 표현.
6. `LookupEmptyState`
   - 예매 번호 안내 문구, 고객센터 연락처 링크.

### 3.2 Hooks & State
1. `useReservationLookup`
   - `useMutation`으로 `/api/reservations/lookup` 호출.
   - 성공 시 결과 상태 저장, 실패 시 에러 코드별 메시지.
   - Mutation 상태에 따라 Skeleton/로딩 상태 전환.
2. 별도 전역 상태는 필요 없으며 React Query Mutation 결과만 사용.

### 3.3 Backend
1. `schema.ts`
   - `reservationLookupRequestSchema`: `orderNumber`, `contact`.
   - `reservationLookupResponseSchema`: 공연 정보, 좌석, 결제 정보, 상태, `redirectTo`.
2. `service.ts`
   - `reservation_orders`에서 `order_number`, `contact_phone`/`contact_email` 매칭.
   - 좌석 정보는 `reservation_order_seats` 조인 후 리스트 반환.
   - 결과 없으면 `RESERVATION_NOT_FOUND`, 취소 주문은 상태 `CANCELLED`.
3. `route.ts`
   - `app.post('/api/reservations/lookup', ...)`
   - 요청 Body 검증, `respond()` 헬퍼로 반환.
4. `error.ts`
   - `RESERVATION_NOT_FOUND`, `RESERVATION_CONTACT_MISMATCH`, `RESERVATION_EXPIRED`.

### 3.4 테스트 & QA
- **Frontend QA**
  - 예약 번호/연락처 형식 검증, 잘못된 입력 시 메시지 확인.
  - 성공 결과에서 CTA 동작 확인.
  - 예매 번호 복사 기능(추가 시) 테스트.
- **Backend 단위 테스트**
  - 존재하지 않는 예약 → 404.
  - 연락처 불일치 → 403.
  - 취소/만료 상태 → 상태 코드/메시지 확인.
- **통합 테스트**
  - 예매 완료 후 예약 번호로 조회 → 동일 정보 노출.
  - 비회원/회원 케이스 각각 재현.

---

## 4. 통합 체크리스트
- [ ] `registerReservationLookupRoutes(app)` 등록
- [ ] 모든 컴포넌트 `"use client"` 선언
- [ ] `@/lib/remote/api-client` 사용
- [ ] 입력값 에러 메시지 번역/문구 PRD 일치 확인
- [ ] Skeleton/Empty/에러/결과 상태 별 UI 검토
- [ ] 접근성: 폼 레이블, 오류 메시지 `aria-describedby` 연결

---

## 5. 참고 문서
- `docs/userflow.md` – 플로우 5 (예매 완료 후 조회)
- `docs/prd.md` – 예약 조회 요구사항
- `docs/state-management.md` – Mutation 상태 관리 가이드
- `docs/database.md` – 예약 관련 스키마

---

## 6. 향후 확장 아이디어
- 이메일 전송 기능(예매 내역 PDF 발송)
- 예약 번호 자동 완성(최근 조회 기록)
- 고객센터 챗봇 연동
- 예매 취소/변경 신청 링크 추가
