# UC-010: 마이페이지 - 상세 계획

---

## 1. 개요

### 1.1 목적
로그인한 사용자가 본인의 예매 내역과 찜한 공연을 한눈에 확인하고 필요한 후속 액션(티켓 확인, 예매 취소, 공연 상세 보기 등)을 수행할 수 있도록 한다. React Query를 통한 서버 상태 관리와 Supabase 데이터 일관성을 유지하며, 비어 있는 상태에서도 친화적인 안내를 제공한다.

### 1.2 주요 기능
- 예매 내역 목록(진행 중/완료/취소 상태 포함)
- 예매 상세로 이동/티켓 보기/취소 요청 액션
- 찜한 공연 목록 및 찜 해제 기능
- 필터/정렬(최신순 기본, 필요 시 확장)
- 로딩/에러/빈 상태 처리, 모바일 대응 레이아웃

### 1.3 경로 및 범위
- **페이지 경로**: `/mypage`
- **접근 권한**: 로그인 사용자 필수 (비로그인 접근 시 로그인 모달/리다이렉션)
- **주요 API 엔드포인트**:
  - `GET /api/mypage/reservations` : 예매 내역
  - `GET /api/mypage/favorites` : 찜한 공연
  - `POST /api/favorites/toggle` : 찜 토글 (기존 기능 재사용)
- **의존 데이터**: `reservation_orders`, `reservation_order_seats`, `concerts`, `favorite_concerts`

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **MyPage** | `src/app/mypage/page.tsx` | 페이지 엔트리. Auth 가드 및 레이아웃 |
| **MyPageView** | `src/features/mypage/components/my-page-view.tsx` | 전체 레이아웃 컨테이너 |
| **MyPageTabs** | `src/features/mypage/components/my-page-tabs.tsx` | 탭 전환 UI (예매 / 찜) |
| **ReservationsPanel** | `src/features/mypage/components/reservations-panel.tsx` | 예매 리스트 영역 |
| **ReservationCard** | `src/features/mypage/components/reservation-card.tsx` | 예매 단일 카드 |
| **FavoritesPanel** | `src/features/mypage/components/favorites-panel.tsx` | 찜 공연 리스트 영역 |
| **FavoriteConcertCard** | `src/features/mypage/components/favorite-concert-card.tsx` | 찜 공연 카드 |
| **EmptyState** | `src/features/mypage/components/empty-state.tsx` | Empty/에러 상태 UI |
| **ListSkeleton** | `src/features/mypage/components/list-skeleton.tsx` | 로딩 스켈레톤 |
| **useMyReservations** | `src/features/mypage/hooks/useMyReservations.ts` | 예매 데이터 Fetch |
| **useMyFavorites** | `src/features/mypage/hooks/useMyFavorites.ts` | 찜 목록 Fetch |
| **useFavoriteToggle** | `src/features/common/hooks/useFavoriteToggle.ts` | 찜 토글 공통 훅 |
| **mypage/backend/schema** | `src/features/mypage/backend/schema.ts` | API 스키마 |
| **mypage/backend/service** | `src/features/mypage/backend/service.ts` | Supabase 서비스 |
| **mypage/backend/route** | `src/features/mypage/backend/route.ts` | `/api/mypage/*` 라우터 |
| **mypage/backend/error** | `src/features/mypage/backend/error.ts` | 마이페이지 오류 코드 |
| **mypage/lib/dto** | `src/features/mypage/lib/dto.ts` | DTO 재노출 |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "App Router"
        Page[`src/app/mypage/page.tsx`]
    end

    subgraph "Presentation"
        View[MyPageView]
        Tabs[MyPageTabs]
        ReservationPanel[ReservationsPanel]
        ReservationCard[ReservationCard]
        FavoritePanel[FavoritesPanel]
        FavoriteCard[FavoriteConcertCard]
        Empty[EmptyState]
        Skeleton[ListSkeleton]
    end

    subgraph "Hooks"
        ReservationsHook[useMyReservations]
        FavoritesHook[useMyFavorites]
        FavoriteToggleHook[useFavoriteToggle]
        AuthHook[useCurrentUser]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`mypage/backend/route.ts`]
        Service[`mypage/backend/service.ts`]
        Schema[`mypage/backend/schema.ts`]
        Error[`mypage/backend/error.ts`]
    end

    subgraph "Database"
        ReservationOrders[(reservation_orders)]
        ReservationSeats[(reservation_order_seats)]
        Concerts[(concerts)]
        ConcertSchedules[(concert_schedules)]
        Favorites[(favorite_concerts)]
    end

    Page --> View
    View --> Tabs
    View --> ReservationPanel
    View --> FavoritePanel
    ReservationPanel --> ReservationCard
    FavoritePanel --> FavoriteCard
    ReservationPanel --> Empty
    FavoritePanel --> Empty
    View --> Skeleton

    View --> ReservationsHook
    View --> FavoritesHook
    FavoriteCard --> FavoriteToggleHook
    View --> AuthHook

    ReservationsHook --> ApiClient
    FavoritesHook --> ApiClient
    FavoriteToggleHook --> ApiClient
    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> ReservationOrders
    Service --> ReservationSeats
    Service --> Concerts
    Service --> ConcertSchedules
    Service --> Favorites
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `MyPage`
   - `"use client"` 선언.
   - `useCurrentUser`로 인증 체크 후 미로그인 시 로그인 모달 또는 `/` 리다이렉션.
   - React Query `Hydrate`로 CSR 데이터 사용.
2. `MyPageView`
   - `Tabs` 컴포넌트로 예매/찜 영역 전환.
   - 상단에 사용자 인사(닉네임) 및 안내 문구.
   - 뷰 전환 시 `ts-pattern`으로 상태 분기.
3. `ReservationsPanel`
   - `useMyReservations` Suspense Query 통해 데이터 전달.
   - 각 카드에 예매 번호, 공연명, 날짜, 좌석, 상태 배지.
   - 액션: 예매 상세 보기(`/reservations/[id]`), 티켓 보기, 취소 요청 버튼(추후 확장).
   - Empty 상태: `EmptyState` 호출, CTA로 메인 이동.
4. `ReservationCard`
   - 썸네일 `https://picsum.photos/seed/${orderId}/320/180`.
   - 상태별 배지(`결제 완료`, `취소 진행`, `사용 완료` 등).
   - Tailwind 카드 레이아웃, 접근성 `role="article"`.
5. `FavoritesPanel` & `FavoriteConcertCard`
   - 카드 그리드(Desktop 3열, Tablet 2열, Mobile 1열).
   - 찜 해제 버튼은 `useFavoriteToggle`.
   - 공연 시작 임박/매진 상태 배지 표기.
6. `EmptyState`, `ListSkeleton`
   - 재사용 가능한 컴포넌트로 로딩/빈 상태를 일관되게 표현.
   - Icon(`lucide-react`) + 설명 + CTA.

### 3.2 Hooks & State
1. `useMyReservations`
   - `useSuspenseQuery(['mypage', 'reservations'])`.
   - 요청 파라미터: 최근 순 정렬, 페이지네이션 (Page/Limit) 옵션.
   - 응답 파싱 후 UI friendly DTO 리턴.
2. `useMyFavorites`
   - `useSuspenseQuery(['mypage', 'favorites'])`.
   - 필터 옵션(장르, 공연일정)을 위한 파라미터 확장 준비.
3. `useFavoriteToggle`
   - Optimistic update: 찜 해제 시 `favorites` 캐시에서 즉시 제거.
   - 실패 시 Toast 및 롤백.
4. 전역 상태는 필요 없고 React Query로 일원화.

### 3.3 Backend
1. `schema.ts`
   - `mypageReservationsResponseSchema`: 예매 ID, 공연 정보, 결제 상태, 좌석 배열.
   - `mypageFavoritesResponseSchema`: 공연 ID, 썸네일, 일정, 상태.
   - `redirectTo` 필드는 `z.string()`.
2. `service.ts`
   - `reservation_orders` + `concerts` + `concert_schedules` 조인.
   - 상태별 필터(취소/완료) 및 최근 순 정렬.
   - 찜 목록은 `favorite_concerts` 조인, 공연 상태 반영.
3. `route.ts`
   - `app.get('/api/mypage/reservations', ...)`
   - `app.get('/api/mypage/favorites', ...)`
   - 인증 미들웨어(`withAppContext` → `supabase.auth.getUser`)로 사용자 식별.
4. `error.ts`
   - `MYPAGE_UNAUTHORIZED`, `MYPAGE_RESERVATION_NOT_FOUND`, `MYPAGE_FAVORITE_NOT_FOUND`.
5. 캐시 정책: `success()` 응답에 `updatedAt` 포함하여 최신 여부 확인.

### 3.4 테스트 & QA
- **Frontend QA**
  - 예매/찜 데이터가 없을 때 빈 상태 노출.
  - 찜 해제 시 리스트에서 즉시 제거, 실패 롤백.
  - 모바일 탭 전환 및 카드 레이아웃 확인.
  - API 오류 시 에러 상태 UI와 재시도 버튼.
- **Backend 단위 테스트**
  - 예매 조회: 로그인 사용자 외 접근 시 401.
  - 찜 목록: 공연 비공개/삭제 상태 필터링.
  - Pagination, 정렬 동작.
- **통합 테스트**
  - 예매 완료 → 마이페이지 → 예매 상세 이동 흐름.
  - 찜 추가/해제 시 마이페이지 반영 여부.

---

## 4. 통합 체크리스트
- [ ] `registerMypageRoutes(app)` Hono 등록
- [ ] 모든 컴포넌트 `"use client"` 선언
- [ ] API 호출은 `@/lib/remote/api-client` 사용
- [ ] React Query 캐시 키 통일 (`['mypage', 'reservations']`, `['mypage', 'favorites']`)
- [ ] `picsum.photos` placeholder seed 고정
- [ ] 접근성: 탭 키보드 전환, 카드 `aria-label` 검증

---

## 5. 참고 문서
- `docs/userflow.md` – 플로우 6 (예매 확인) 및 마이페이지 접근 흐름
- `docs/prd.md` – 마이페이지 요구사항, 상태 정의
- `docs/state-management.md` – React Query 캐시/Prefetch 가이드
- `docs/database.md` – 예매/찜 테이블 스키마

---

## 6. 향후 확장 아이디어
- 예매 취소/환불 요청 액션 통합
- 알림 설정(공연 시작 전 알림, 좌석 업그레이드 제안)
- 필터(기간, 공연명) 및 검색 기능 추가
- 티켓 공유/다운로드 기능 연동
