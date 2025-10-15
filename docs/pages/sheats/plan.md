# UC-005: 좌석 선택 페이지 - 상세 계획

---

## 1. 개요

### 1.1 목적
공연 상세 페이지에서 예매 CTA를 누른 사용자가 공연장 좌석 배치를 직관적으로 확인하고 원하는 좌석을 선택·해제하며, 일정 시간 동안 좌석을 선점할 수 있도록 한다. 좌석 등급, 가격, 잔여 여부를 시각적으로 표현하고, 좌석 선점 성공 시 예매 정보 입력 단계로 이동시킨다.

### 1.2 주요 기능
- 공연장 좌석 지도 렌더링(구역별/등급별 컬러)
- 좌석 선택/해제, 선택 수량 제한
- 선택 좌석 요약 및 총 금액 표시
- 좌석 선점 요청 및 만료 타이머
- 접근성 지원(키보드 선택, 좌석 상태 설명)

### 1.3 경로 및 범위
- **페이지 경로**: `/concerts/[concertId]/seats`
- **선행 데이터**: 공연 상세(`concertId`), 스케줄(`scheduleId`) 파라미터
- **주요 API 엔드포인트**:
  - `GET /api/concerts/:concertId/seats` : 좌석 배치/상태 조회
  - `POST /api/reservations/hold` : 좌석 선점
  - `DELETE /api/reservations/hold` : 좌석 선점 취소(타임아웃/사용자 취소)
- **권한 요구**: 로그인/비로그인 공통, 단 예매 진행 시 연락처 입력 필요

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **SeatSelectionPage** | `src/app/concerts/[concertId]/seats/page.tsx` | 페이지 엔트리 |
| **SeatSelectionView** | `src/features/seat-selection/components/seat-selection-view.tsx` | 전체 레이아웃 |
| **SeatLegend** | `src/features/seat-selection/components/seat-legend.tsx` | 좌석 상태/등급 범례 |
| **SeatMapCanvas** | `src/features/seat-selection/components/seat-map-canvas.tsx` | 좌석 지도 렌더링 |
| **SeatListFallback** | `src/features/seat-selection/components/seat-list-fallback.tsx` | 목록 형태 좌석 선택(모바일) |
| **SelectedSeatSummary** | `src/features/seat-selection/components/selected-seat-summary.tsx` | 선택 좌석/금액 요약 |
| **SeatActionBar** | `src/features/seat-selection/components/seat-action-bar.tsx` | 예매 진행 CTA, 타이머 |
| **useSeatMap** | `src/features/seat-selection/hooks/useSeatMap.ts` | 좌석 데이터 Fetch |
| **useSelectedSeatsStore** | `src/features/seat-selection/hooks/useSelectedSeatsStore.ts` | Zustand 기반 선택 좌석 상태 |
| **useSeatHoldMutation** | `src/features/seat-selection/hooks/useSeatHoldMutation.ts` | 좌석 선점 Mutation |
| **useSeatReleaseMutation** | `src/features/seat-selection/hooks/useSeatReleaseMutation.ts` | 좌석 선점 해제 Mutation |
| **seatSelection/backend/schema** | `src/features/seat-selection/backend/schema.ts` | 좌석 API 스키마 |
| **seatSelection/backend/service** | `src/features/seat-selection/backend/service.ts` | Supabase 좌석 로직 |
| **seatSelection/backend/route** | `src/features/seat-selection/backend/route.ts` | `/api/reservations/hold` 등 |
| **seatSelection/backend/error** | `src/features/seat-selection/backend/error.ts` | 좌석 오류 코드 |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "App Router"
        Page[`src/app/concerts/[concertId]/seats/page.tsx`]
    end

    subgraph "Presentation"
        View[SeatSelectionView]
        Legend[SeatLegend]
        Canvas[SeatMapCanvas]
        ListFallback[SeatListFallback]
        Summary[SelectedSeatSummary]
        ActionBar[SeatActionBar]
    end

    subgraph "Hooks"
        SeatMapHook[useSeatMap]
        SelectedStore[useSelectedSeatsStore]
        HoldHook[useSeatHoldMutation]
        ReleaseHook[useSeatReleaseMutation]
        CountdownHook[useSeatCountdown]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`seat-selection/backend/route.ts`]
        Service[`seat-selection/backend/service.ts`]
        Schema[`seat-selection/backend/schema.ts`]
        Error[`seat-selection/backend/error.ts`]
    end

    subgraph "Database"
        Seats[(concert_seats)]
        SeatCategories[(concert_seat_categories)]
        Reservations[(reservation_orders)]
        ReservationHolds[(reservation_holds)]
    end

    Page --> View
    View --> Legend
    View --> Canvas
    View --> ListFallback
    View --> Summary
    View --> ActionBar

    View --> SeatMapHook
    Canvas --> SelectedStore
    ListFallback --> SelectedStore
    Summary --> SelectedStore
    ActionBar --> HoldHook
    ActionBar --> ReleaseHook
    ActionBar --> CountdownHook

    SeatMapHook --> ApiClient
    HoldHook --> ApiClient
    ReleaseHook --> ApiClient
    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> Seats
    Service --> SeatCategories
    Service --> Reservations
    Service --> ReservationHolds
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `SeatSelectionPage`
   - `"use client"` 선언.
   - `useParams`에서 `concertId`, `scheduleId` 읽기(쿼리/검색 파라미터).
   - `useSeatMap`로 좌석 데이터 prefetch, `Suspense` 처리.
2. `SeatSelectionView`
   - Desktop: 좌석 지도 + 요약/CTA 2열 레이아웃.
   - Mobile: 지도 상단, 요약/CTA 하단 고정.
   - 로딩 시 Skeleton, 데이터 없으면 오류 안내.
3. `SeatLegend`
   - 좌석 상태별 컬러/아이콘 안내 (예매 가능, 선택됨, 판매 종료, 휠체어석 등).
4. `SeatMapCanvas`
   - SVG/Canvas 기반 좌석 렌더링.
   - 좌석 클릭 시 `useSelectedSeatsStore` 업데이트.
   - 확대/축소(옵션), 접근성 ARIA 속성 (`role="grid"`).
5. `SeatListFallback`
   - 지도 접근 어려운 사용자를 위한 리스트 UI.
   - 필터/정렬 제공(구역/가격 순).
6. `SelectedSeatSummary`
   - 선택 좌석 목록, 합계 금액, 잔여 타이머.
   - 좌석 제거 버튼.
7. `SeatActionBar`
   - `선택 좌석 초기화`, `예매 진행` 버튼.
   - `useSeatHoldMutation` 실행 후 성공 시 `/booking`으로 이동.
   - 만료 타이머 (`CountdownHook`) 표시.

### 3.2 Hooks & State
1. `useSeatMap`
   - `useSuspenseQuery(['seat-map', concertId, scheduleId])`.
   - 응답 데이터에서 좌석 상태(`AVAILABLE`, `ON_HOLD`, `SOLD`), 좌표, 등급 정보 파싱.
2. `useSelectedSeatsStore`
   - Zustand로 선택 좌석 배열, 최대 선택 수 제한(PRD: 4석).
   - `selectSeat`, `deselectSeat`, `resetSeats` 액션 제공.
3. `useSeatHoldMutation`
   - `useMutation`으로 `/api/reservations/hold` 호출.
   - 요청 바디: 좌석 ID 배열, 선점 만료 시각 요청.
   - 성공 시 Zustand에 `holdId`, `expiresAt` 저장.
4. `useSeatReleaseMutation`
   - 페이지 떠날 때/타이머 만료 시 `holdId`로 해제.
   - `useEffect` cleanup 또는 `beforeunload` 핸들러.
5. `useSeatCountdown`
   - `react-use` `useInterval` + `date-fns`로 남은 시간 계산.
   - 0초 도달 시 `useSeatReleaseMutation` 호출 후 안내 모달.

### 3.3 Backend
1. `schema.ts`
   - `seatMapParamsSchema`, `seatMapResponseSchema` (좌표, 상태, 가격).
   - `seatHoldRequestSchema` : `concertId`, `scheduleId`, `seatIds`.
   - `seatHoldResponseSchema` : `holdId`, `expiresAt`.
2. `service.ts`
   - 좌석 조회: `concert_seats` + `concert_seat_categories` 조인.
   - 선점: 트랜잭션으로 `reservation_holds` 테이블 생성/갱신, 만료 시간 설정.
   - 기존 선점 충돌 시 `SEAT_ALREADY_HELD` 반환.
3. `route.ts`
   - `app.get('/api/concerts/:concertId/seats', ...)`
   - `app.post('/api/reservations/hold', ...)`
   - `app.delete('/api/reservations/hold', ...)`
   - `success()/failure()` 표준 응답.
4. `error.ts`
   - `SEAT_NOT_FOUND`, `SEAT_ALREADY_HELD`, `SEAT_SOLD_OUT`, `SEAT_HOLD_EXPIRED`.

### 3.4 테스트 & QA
- **Frontend QA**
  - 4석 초과 선택 불가, 메시지 출력.
  - 지도/리스트에서 선택 동기화.
  - 타이머 만료 시 좌석 초기화 및 안내 모달 작동.
  - 모바일 터치 지원, 키보드 내비게이션.
- **Backend 단위 테스트**
  - 선점 트랜잭션 동작, 중복 선점 방지.
  - 만료 처리(만료된 hold 삭제).
  - 좌석 상태 동시성 테스트.
- **통합 테스트**
  - 상세 → 좌석 선택 → 예매 정보 입력 흐름.
  - 동시 사용자 시나리오(한 좌석을 동시에 선택).

---

## 4. 통합 체크리스트
- [ ] `registerSeatSelectionRoutes(app)` 등록
- [ ] 모든 컴포넌트 `"use client"` 선언
- [ ] API 호출 `@/lib/remote/api-client` 사용
- [ ] `picsum.photos` 대신 좌석은 SVG, 요약 카드 이미지 placeholder만 사용
- [ ] `AppLogger.info/error`로 선점 결과 로깅
- [ ] 타이머/좌석 상태 접근성(`aria-live`, `role="gridcell"`) 점검

---

## 5. 참고 문서
- `docs/userflow.md` – 플로우 3 (좌석 선택)
- `docs/prd.md` – 좌석 선택 요구사항, 제약 조건
- `docs/state-management.md` – Zustand + React Query 연동
- `docs/database.md` – 좌석/선점 관련 테이블

---

## 6. 향후 확장 아이디어
- 3D 지도 또는 구역별 확대/축소 기능
- 그룹 좌석 추천 알고리즘
- 휠체어석/동반석 필터
- 실시간 웹소켓 좌석 갱신
