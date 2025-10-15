# UC-002: 콘서트 상세 페이지 - 상세 계획

---

## 1. 개요

### 1.1 목적
메인 페이지에서 선택된 특정 콘서트의 세부 정보를 제공하여 사용자가 공연 일정, 장소, 좌석 등급과 가격, 소개 콘텐츠를 충분히 확인하고 예매로 전환할 수 있도록 한다. 로그인 상태에 따라 찜 기능 및 좌석 선택 흐름을 자연스럽게 안내한다.

### 1.2 주요 기능
- 공연 기본 정보(제목, 아티스트, 일정, 장소, 썸네일) 노출
- 공연 소개 섹션(상세 설명, 유의사항, 출연진)
- 좌석 등급/가격표, 남은 좌석 정보 요약
- 찜/공유/CTA(좌석 선택) 인터랙션
- 관련 공연 추천 섹션 (선택 사항)

### 1.3 경로 및 범위
- **페이지 경로**: `/concerts/[concertId]`
- **선행 단계**: 메인/목록 → 상세 페이지 진입
- **주요 API 엔드포인트**:
  - `GET /api/concerts/:concertId` : 콘서트 상세
  - `GET /api/concerts/:concertId/metrics` : 예약 현황/찜 수 등 지표
  - `POST /api/favorites/toggle` : 찜 토글
- **권한 요구**: 모든 사용자 접근 가능, 찜/좌석 선택은 로그인 필요

---

## 2. 모듈 구조 계획

### 2.1 모듈 개요

| 모듈 | 위치 | 설명 |
|------|------|------|
| **ConcertDetailPage** | `src/app/concerts/[concertId]/page.tsx` | 상세 페이지 엔트리 |
| **ConcertDetailView** | `src/features/concert-detail/components/concert-detail-view.tsx` | 화면 레이아웃 컨테이너 |
| **ConcertHeroSection** | `src/features/concert-detail/components/concert-hero-section.tsx` | 썸네일, 기본 정보, 찜 버튼 |
| **ConcertMetaList** | `src/features/concert-detail/components/concert-meta-list.tsx` | 일정/장소/관람등급 등 메타 정보 |
| **PricingTable** | `src/features/concert-detail/components/pricing-table.tsx` | 좌석 등급/가격표 |
| **AvailabilityBadge** | `src/features/concert-detail/components/availability-badge.tsx` | 잔여 좌석 상태 배지 |
| **ConcertDescription** | `src/features/concert-detail/components/concert-description.tsx` | 상세 설명/출연진/유의사항 |
| **RecommendedConcerts** | `src/features/concert-detail/components/recommended-concerts.tsx` | 연관 공연 섹션 |
| **useConcertDetail** | `src/features/concert-detail/hooks/useConcertDetail.ts` | 상세 Fetch 훅 |
| **useConcertMetrics** | `src/features/concert-detail/hooks/useConcertMetrics.ts` | 예약 현황/찜 수 Fetch 훅 |
| **useFavoriteToggle** | `src/features/common/hooks/useFavoriteToggle.ts` | 찜 토글 공통 훅 (재사용) |
| **concertDetail/backend/schema** | `src/features/concert-detail/backend/schema.ts` | 상세/지표 응답 스키마 |
| **concertDetail/backend/service** | `src/features/concert-detail/backend/service.ts` | Supabase 조인 로직 |
| **concertDetail/backend/route** | `src/features/concert-detail/backend/route.ts` | `/api/concerts/:concertId` 라우터 |
| **concertDetail/backend/error** | `src/features/concert-detail/backend/error.ts` | 에러 코드정의 |
| **concertDetail/lib/dto** | `src/features/concert-detail/lib/dto.ts` | 프론트 재사용 DTO |

### 2.2 관계 다이어그램
```mermaid
graph TB
    subgraph "App Router"
        Page[`src/app/concerts/[concertId]/page.tsx`]
    end

    subgraph "Presentation"
        View[ConcertDetailView]
        Hero[ConcertHeroSection]
        Meta[ConcertMetaList]
        Pricing[PricingTable]
        Badge[AvailabilityBadge]
        Desc[ConcertDescription]
        Reco[RecommendedConcerts]
    end

    subgraph "Hooks"
        DetailHook[useConcertDetail]
        MetricsHook[useConcertMetrics]
        FavoriteHook[useFavoriteToggle]
        AuthHook[useCurrentUser]
    end

    subgraph "Remote"
        ApiClient[`@/lib/remote/api-client`]
    end

    subgraph "Backend"
        Route[`concert-detail/backend/route.ts`]
        Service[`concert-detail/backend/service.ts`]
        Schema[`concert-detail/backend/schema.ts`]
        Error[`concert-detail/backend/error.ts`]
    end

    subgraph "Database"
        Concerts[(concerts)]
        Schedules[(concert_schedules)]
        Venues[(venues)]
        SeatCategories[(concert_seat_categories)]
        Favorites[(favorite_concerts)]
    end

    Page --> View
    View --> Hero
    View --> Meta
    View --> Pricing
    Pricing --> Badge
    View --> Desc
    View --> Reco

    View --> DetailHook
    Hero --> FavoriteHook
    View --> MetricsHook
    Hero --> AuthHook

    DetailHook --> ApiClient
    MetricsHook --> ApiClient
    FavoriteHook --> ApiClient
    ApiClient --> Route
    Route --> Service
    Route --> Schema
    Route --> Error
    Service --> Concerts
    Service --> Schedules
    Service --> Venues
    Service --> SeatCategories
    Service --> Favorites
```

---

## 3. Implementation Plan

### 3.1 Presentation Layer
1. `ConcertDetailPage`
   - `"use client"` 선언.
   - `generateStaticParams` 대신 CSR + React Query로 데이터 로드.
   - `useParams`로 `concertId` 확보, `useConcertDetail` 호출.
2. `ConcertDetailView`
   - 상단 Hero, 메타 정보, 가격표, 소개, 추천 공연 순으로 배치.
   - Tailwind Grid(Desktop 2열, Mobile 1열), `container mx-auto` 레이아웃.
   - `ts-pattern`으로 상태 분기(로딩/오류/성공).
3. `ConcertHeroSection`
   - `picsum.photos/seed/${concertId}/960/540` 썸네일, 공연명, 아티스트, 찜 버튼.
   - 찜 버튼은 `useFavoriteToggle` 활용, optimistic update.
4. `ConcertMetaList`
   - 일정, 시간, 장소, 관람등급, 진행시간 등 리스트 구성.
   - 아이콘(`lucide-react`)으로 정보 강조.
5. `PricingTable`
   - 좌석 등급별 가격/잔여 좌석 수/설명.
   - 가용 좌석이 없으면 `매진` 배지로 표시.
6. `AvailabilityBadge`
   - 지표(`MetricsHook`) 기반 상태(`ON_SALE`, `CLOSE_SOON`, `SOLD_OUT`) 매핑.
   - 색상 대비 확인, `aria-label` 제공.
7. `ConcertDescription`
   - PRD 기반 세부 설명/유의사항/출연진/FAQ 블록.
   - `react-markdown` 필요 시 `@/components/markdown` 재사용 고려.
8. `RecommendedConcerts`
   - `useQuery`로 연관 공연 리스트 가져오기(선택 사항).
   - 카드 UI 재사용, Skeleton/Empty 처리.

### 3.2 Hooks & State
1. `useConcertDetail`
   - `useSuspenseQuery(['concert-detail', concertId])`.
   - Supabase 응답을 DTO로 매핑, 오류 시 ErrorBoundary.
2. `useConcertMetrics`
   - 예약률, 찜 수, 시작까지 남은 시간 계산.
   - `staleTime` 적절히 설정(5분).
3. `useFavoriteToggle`
   - 기존 공용 로직 재사용, 성공 시 `metrics` 캐시 업데이트.
4. `useCurrentUser`
   - 로그인 여부로 찜 버튼 상태/CTA 문구 결정.

### 3.3 Backend
1. `schema.ts`
   - `concertDetailParamsSchema`, `concertDetailResponseSchema`.
   - 썸네일 URL은 Supabase 스토리지 경로 또는 placeholder, `z.string().url()` 대신 `z.string()`.
2. `service.ts`
   - `concerts` + `concert_schedules` + `venues` 조인.
   - 좌석 등급 집계: `concert_seat_categories`와 좌석 잔여량 계산.
   - 찜 수는 `favorite_concerts` 카운트.
3. `route.ts`
   - `app.get('/api/concerts/:concertId', ...)`
   - `app.get('/api/concerts/:concertId/metrics', ...)`
   - 에러 매핑: `CONCERT_NOT_FOUND`, `CONCERT_PRIVATE`.
4. `error.ts`
   - 상세 미존재, 판매 종료, 권한 오류 정의.

### 3.4 테스트 & QA
- **Frontend QA**
  - 존재하지 않는 공연 ID → 404 안내.
  - 찜 버튼 로그인 전후 상태 전환.
  - 좌석 등급/잔여 좌석 정렬 및 반응형 확인.
- **Backend 단위 테스트**
  - 콘서트 조인 결과 검증, 좌석 잔여량 계산.
  - 찜 수 증가/감소 트랜잭션.
- **통합 테스트**
  - 메인 → 상세 → 좌석 선택 플로우.
  - 캐시 만료 시 재호출 여부.

---

## 4. 통합 체크리스트
- [ ] `registerConcertDetailRoutes(app)` Hono 등록
- [ ] 모든 컴포넌트 `"use client"` 선언
- [ ] HTTP는 `@/lib/remote/api-client` 사용
- [ ] `picsum.photos` seed 고정으로 placeholder 일관성 확보
- [ ] 접근성: 이미지 대체 텍스트, 정보 리스트 `dl` 구조
- [ ] 찜 토글 실패 시 롤백 및 오류 Toast

---

## 5. 참고 문서
- `docs/userflow.md` – 플로우 2 (콘서트 상세 확인)
- `docs/prd.md` – 콘서트 상세 요구사항
- `docs/state-management.md` – React Query 캐시 정책
- `docs/database.md` – 콘서트/좌석 관련 테이블 정의

---

## 6. 향후 확장 아이디어
- 공연 후기/평점 섹션 추가
- 공연장 지도 보기(카카오/네이버 지도 연동)
- 소셜 공유(카카오톡/트위터) 버튼
- 라이브 판매 알림 구독
