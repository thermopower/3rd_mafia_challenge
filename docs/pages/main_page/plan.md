# UC-001: 메인 페이지 (콘서트 목록) - 상세 계획

## 1. 개요

### 1.1 목적
TicketGem 사용자가 현재 판매 중인 공연을 탐색하고 원하는 공연을 빠르게 찾을 수 있도록 검색, 필터, 카드형 리스트를 제공하는 메인 페이지를 설계한다.

### 1.2 주요 기능
- 홈 진입 시 즉시 노출되는 공연 카드 그리드
- 키워드 기반 공연 검색과 추천 필터
- 로그인 상태에 따라 CTA(찜/예매) 상태 반영
- 예약 마감, 매진 등 상태 배지 및 접근성 대응
- React Query 기반 공연 리스트 캐싱 및 상태 관리

### 1.3 경로 및 범위
- **페이지 경로**: `/`
- **주요 API 엔드포인트**:
  - `GET /api/concerts` (공연 목록 조회)
  - `GET /api/concerts/recommendations` (추천 공연)
  - `POST /api/favorites/toggle` (찜 토글 – 기존 기능 재사용)

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **HomePage** | `src/app/page.tsx` | 메인 페이지 엔트리, 서버 컴포넌트 래퍼 → 클라이언트 위임 |
| **HomePageView** | `src/features/home/components/home-page-view.tsx` | 페이지 전반 UI 구성, 섹션/레이아웃 관리 |
| **HeroSearchSection** | `src/features/home/components/hero-search-section.tsx` | 검색 인풋, 인기 검색어, 빠른 필터 |
| **ConcertGrid** | `src/features/home/components/concert-grid.tsx` | 공연 카드 그리드 및 리스트 Empty/Loading 처리 |
| **ConcertCard** | `src/features/home/components/concert-card.tsx` | 개별 공연 카드, 상태 배지, CTA 노출 |
| **HomeSkeleton** | `src/features/home/components/home-skeleton.tsx` | 초기 로딩 스켈레톤 |
| **useConcertList** | `src/features/home/hooks/useConcertList.ts` | 공연 목록 React Query 훅 |
| **useRecommendedConcerts** | `src/features/home/hooks/useRecommendedConcerts.ts` | 추천 공연 조회 React Query 훅 |
| **home/backend/schema** | `src/features/home/backend/schema.ts` | 공연 목록/추천 응답 스키마 정의 |
| **home/backend/service** | `src/features/home/backend/service.ts` | Supabase 질의 및 캐싱 정책 |
| **home/backend/route** | `src/features/home/backend/route.ts` | Hono 라우터, `/api/concerts` 등록 |
| **home/backend/error** | `src/features/home/backend/error.ts` | 오류 코드 및 메시지 관리 |
| **home/lib/dto** | `src/features/home/lib/dto.ts` | 프론트에서 재사용할 DTO 타입 재노출 |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "App Router"
        Page[`src/app/page.tsx`]
    end

    subgraph "Presentation"
        View[HomePageView]
        Hero[HeroSearchSection]
        Grid[ConcertGrid]
        Card[ConcertCard]
        Skeleton[HomeSkeleton]
    end

    subgraph "Hooks"
        ListHook[useConcertList]
        RecommendHook[useRecommendedConcerts]
        FavoriteHook[useFavoriteToggle]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`home/backend/route.ts`]
        Service[`home/backend/service.ts`]
        Schema[`home/backend/schema.ts`]
        Error[`home/backend/error.ts`]
    end

    subgraph "Database"
        Concerts[(concerts)]
        ConcertSchedules[(concert_schedules)]
        FavoriteConcerts[(favorite_concerts)]
    end

    Page --> View
    View --> Hero
    View --> Grid
    Grid --> Card
    View --> Skeleton

    View --> ListHook
    View --> RecommendHook
    Card --> FavoriteHook

    ListHook --> ApiClient
    RecommendHook --> ApiClient
    FavoriteHook --> ApiClient

    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> Concerts
    Service --> ConcertSchedules
    Service --> FavoriteConcerts
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `HomePageView`
   - 섹션 레이아웃(Tailwind) 구성, Suspense 경계 설정.
   - 검색/필터, 추천 공연, 전체 리스트 영역을 Slot 구성으로 배치.
   - QA: 검색 영역 포커스 이동, 빈 상태/에러 알림 aria-live 확인.
2. `HeroSearchSection`
   - `useState` 기반 키워드 입력 상태, `react-hook-form` 사용 고려.
   - 인기 검색어 버튼 → 키워드 Prefill, Submit 시 `router.push('/search?keyword=')` 처리.
   - QA: 키보드 탐색, 입력 검증 (최대 길이, 금지 문자).
3. `ConcertGrid`
   - `useConcertList` Suspense 데이터 표시, `EmptyState`/`ErrorState` 분기.
   - `ts-pattern`으로 상태 분기, 카드 4단(Desktop) → 2단(Tablet) → 1단(Mobile) 반응형 구성.
   - QA: Skeleton 노출, Infinite Scroll 대비 `Load more` 플래그 처리.
4. `ConcertCard`
   - 공연 썸네일(https://picsum.photos/seed/{id}/400/560) 활용, 상태 배지(T Badge, lucide 아이콘) 표시.
   - 찜 버튼은 `useFavoriteToggle` 재사용, 로그인 여부 체크.
   - QA: 접근성 라벨, 상태 배지 조합 테스트, 썸네일 로딩 실패 대비 placeholder.
5. `HomeSkeleton`
   - 카드 그리드에 맞춘 Placeholder 컴포넌트, shimmer animation 적용.
   - QA: 다크 모드 대비 색상 대비 체크.

### 3.2 Hooks & State
1. `useConcertList`
   - `react-query` `useQuery` 사용, 키 `['concerts', filters]`.
   - API 요청은 `apiClient.get('/api/concerts', { query })`.
   - 에러 → `AppLogger.error`, Toast로 사용자 알림.
   - QA: 캐시 무효화 조건, 필터 변경 시 refetch.
2. `useRecommendedConcerts`
   - 첫 진입 시 Prefetch (layout에서 `queryClient.prefetchQuery`).
   - 결과 없을 경우 Hidden 처리.
   - QA: Data length 0 처리, 500 에러 핸들링.
3. `useFavoriteToggle`
   - 기존 공통 훅 재사용, optimistic update 시 리스트 캐시 업데이트.
   - QA: 로그인 필요 모달, 실패 시 롤백.

### 3.3 Backend
1. `schema.ts`
   - 요청: 정렬, 페이지네이션, 카테고리 필터 파라미터 정의.
   - 응답: 공연 기본 정보, 잔여 좌석 수, 상태(`'ON_SALE' | 'CLOSED' | 'SOLD_OUT'`).
   - QA: zod refine으로 날짜/가격 유효성 검증.
2. `service.ts`
   - Supabase 질의: `concerts`, `concert_schedules`, `favorite_concerts` 조인.
   - 캐싱 전략: 최신 공연 우선, 페이지네이션 지원.
   - QA: 검색 인덱스 활용(제목/아티스트), 정렬 옵션별 쿼리 커버.
3. `route.ts`
   - `app.get('/api/concerts', ...)` 등록, Query validation → Service 호출 → `success()` 응답.
   - 추천 API는 `/api/concerts/recommendations` 별도 핸들러.
   - QA: Query 파라미터 누락 시 400, 서버 오류 시 500 통일 응답.
4. `error.ts`
   - `HOME_CONCERT_NOT_FOUND`, `HOME_INVALID_FILTER` 등 정의.
   - QA: 예외 매핑 테스트.
5. `app.ts` 등록
   - `registerHomeRoutes(app)` 추가, 개발 환경 HMR 대비.

### 3.4 테스트 & QA
- **Frontend QA Sheet**:
  - 검색 입력 포커스 이동 및 키보드 조작 확인.
  - 공연 없을 때 Empty 상태 문구 노출.
  - 찜 버튼 토글 시 UI 즉시 반영, 실패 시 롤백.
  - 추천 섹션 표시 기준 및 Skeleton 전환 확인.
- **Backend Unit Tests** (예: Vitest):
  - 필터 조합별 Supabase 질의 파라미터 확인.
  - 추천 로직: 예매율/조회수 기반 정렬 검증.
  - 에러 매핑: 유효하지 않은 정렬 옵션 → 400.
- **Integration Checks**:
  - `api-client`로 실제 응답 스키마 검증 (`zod` parse).
  - React Query Devtools로 캐시 상태 검수.

---

## 4. 통합 체크리스트
- [ ] `registerHomeRoutes`를 `src/backend/hono/app.ts`에 연결
- [ ] `src/app/page.tsx`에서 `"use client"` 지시자 포함 여부 확인
- [ ] `@/lib/remote/api-client` 사용으로 HTTP 일원화
- [ ] `plan-maker` 요구 구조 준수 (개요/Diagram/Implementation Plan)
- [ ] 접근성: 주요 버튼 `aria-label`, 배지 대비 점검

---

## 5. 참고 문서
- `docs/userflow.md` – 유저 플로우 1, 2 단계 (검색 → 상세)
- `docs/prd.md` – 메인 페이지 요구사항 섹션
- `docs/state-management.md` – React Query 캐시 정책
- `docs/usecases/UC-001.md` (존재 시) – 메인 페이지 유스케이스

---

## 6. 향후 확장 아이디어
- 지역/장르 필터 추가 및 URL 파라미터 동기화
- 리스트 → 지도 뷰 전환 토글
- 실시간 판매 지표(잔여 좌석, 예매율) 배지 강화
- 추천 API에 개인화 모델 접목 (추후 AB 테스트)
