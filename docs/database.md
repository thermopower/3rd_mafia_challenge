# Database & Data Flow

## 1. 데이터 플로우 개요
- **검색**: 클라이언트가 입력한 `검색 키워드`를 전달하면 API가 `concerts.title`을 기준으로 일치하는 콘서트 목록을 반환한다.
- **상세 조회 & 찜**: 상세 페이지는 `concerts`와 `concert_seat_categories`, `concert_seats` 정보를 로드하고, 로그인 상태일 경우 `favorite_concerts`로 현재 찜 여부를 판별한다.
- **좌석 선택**: 사용자가 좌석을 선택하면 서버는 `reservation_orders`를 `pending` 상태로 생성하고 연결된 좌석을 `reservation_order_seats`에 기록하여 좌석을 선점하며, `hold_expires_at`으로 유효 시간을 관리한다.
- **예약 정보 입력**: 비회원은 직접 `booker_name`, `booker_contact`를 제출하고, 회원은 `profiles`에서 가져온 값을 기본값으로 사용한다. 입력 값은 `reservation_orders`에 저장된다.
- **예약 확정**: 서버가 좌석 선점 상태와 만료 여부를 재검증한 뒤 `reservation_orders.status`를 `confirmed`로 갱신하고 `reservation_number`, `confirmed_at`, `total_price`를 확정한다.
- **예약 확인 및 조회**: 완료 페이지와 비회원 조회, 마이페이지는 `reservation_orders`와 연결된 `reservation_order_seats`, `concerts`, `favorite_concerts`를 기반으로 데이터를 구성한다.

## 2. 테이블 스키마

### 2.1 `profiles`
| Column         | Type   | Constraints                            | Description                          |
|----------------|--------|----------------------------------------|--------------------------------------|
| id             | uuid   | PK, references auth.users(id)          | 회원 계정 식별자                     |
| full_name      | text   |                                        | 회원 기본 이름                       |
| contact_phone  | text   |                                        | 회원 기본 연락처                     |
| created_at     | timestamptz | default now()                     | 생성 시각                            |
| updated_at     | timestamptz | default now()                     | 수정 시각                            |

### 2.2 `concerts`
| Column     | Type       | Constraints            | Description              |
|------------|------------|------------------------|--------------------------|
| id         | uuid       | PK                     | 콘서트 식별자            |
| title      | text       | not null               | 콘서트 이름              |
| created_at | timestamptz| default now()          | 생성 시각                |
| updated_at | timestamptz| default now()          | 수정 시각                |

### 2.3 `concert_seat_categories`
| Column     | Type       | Constraints                           | Description                               |
|------------|------------|---------------------------------------|-------------------------------------------|
| id         | uuid       | PK                                    | 좌석 등급 식별자                          |
| concert_id | uuid       | FK → concerts(id) on delete cascade   | 소속 콘서트                               |
| name       | text       | not null                              | 좌석 등급 이름                            |
| display_color | text    | not null                              | 좌석 등급 색상(hex 등)                    |
| price      | numeric(10,2) | not null                           | 좌석 1석당 금액                           |
| created_at | timestamptz| default now()                         | 생성 시각                                 |
| updated_at | timestamptz| default now()                         | 수정 시각                                 |

### 2.4 `concert_seats`
| Column     | Type       | Constraints                                      | Description                     |
|------------|------------|--------------------------------------------------|---------------------------------|
| id         | uuid       | PK                                               | 좌석 식별자                     |
| concert_id | uuid       | FK → concerts(id) on delete cascade              | 소속 콘서트                     |
| category_id| uuid       | FK → concert_seat_categories(id) on delete cascade| 좌석 등급                       |
| seat_label | text       | not null                                         | 좌석 표기 (예: A-12)            |
| created_at | timestamptz| default now()                                    | 생성 시각                       |
| updated_at | timestamptz| default now()                                    | 수정 시각                       |

### 2.5 `favorite_concerts`
| Column     | Type       | Constraints                                  | Description               |
|------------|------------|----------------------------------------------|---------------------------|
| id         | uuid       | PK                                           | 고유 식별자               |
| user_id    | uuid       | FK → profiles(id) on delete cascade          | 회원 식별자               |
| concert_id | uuid       | FK → concerts(id) on delete cascade          | 찜한 콘서트               |
| created_at | timestamptz| default now()                                | 찜한 시각                 |

> 동일 사용자가 같은 콘서트를 중복으로 찜하지 않도록 `(user_id, concert_id)`에 유니크 인덱스를 둔다.

### 2.6 `reservation_orders`
| Column            | Type        | Constraints                                   | Description                                               |
|-------------------|-------------|-----------------------------------------------|-----------------------------------------------------------|
| id                | uuid        | PK                                            | 예약 식별자                                               |
| reservation_number| text        | not null, unique                              | 사용자에게 안내되는 예약 번호                             |
| concert_id        | uuid        | FK → concerts(id) on delete cascade           | 예약한 콘서트                                             |
| user_id           | uuid        | FK → profiles(id)                             | 회원 예약일 경우 연결 (비회원은 NULL)                    |
| status            | text        | not null, check in ('pending','confirmed','cancelled','expired') | 예약 상태 |
| hold_expires_at   | timestamptz |                                              | 좌석 선점 만료 시각 (pending일 때 활용)                  |
| confirmed_at      | timestamptz |                                              | 예약 확정 시각                                            |
| booker_name       | text        |                                              | 예약자 이름 (회원/비회원 공통 스냅샷)                     |
| booker_contact    | text        |                                              | 예약자 연락처                                             |
| total_price       | numeric(12,2)|                                             | 예약 총 금액                                               |
| created_at        | timestamptz | default now()                                 | 생성 시각                                                 |
| updated_at        | timestamptz | default now()                                 | 수정 시각                                                 |

### 2.7 `reservation_order_seats`
| Column     | Type       | Constraints                                              | Description                                   |
|------------|------------|----------------------------------------------------------|-----------------------------------------------|
| id         | uuid       | PK                                                       | 고유 식별자                                   |
| order_id   | uuid       | FK → reservation_orders(id) on delete cascade            | 소속 예약                                    |
| seat_id    | uuid       | FK → concert_seats(id)                                   | 예약 좌석                                    |
| price      | numeric(10,2)| not null                                              | 좌석 확정 금액                               |
| is_active  | boolean    | default true                                            | 좌석 선점/확정 상태                           |
| created_at | timestamptz| default now()                                           | 생성 시각                                    |

> 좌석 중복 선점을 방지하기 위해 `is_active = true`인 좌석에 대해 `seat_id` 파셜 유니크 인덱스를 둔다. 주문 만료·취소 시 애플리케이션 또는 잡이 `is_active`를 `false`로 갱신한다.

## 3. 제약 및 비즈니스 규칙
- `reservation_orders.status`는 예약 진행 흐름에 따라 `pending → confirmed` 또는 `pending → expired/cancelled`로 전환한다.
- `reservation_orders.hold_expires_at`가 지났고 여전히 `pending`이면 만료 처리하여 좌석을 반납한다.
- 비회원 조회는 `reservation_orders.reservation_number`와 `reservation_orders.booker_name`을 함께 사용해 정확히 일치하는 예약만 반환한다.
- 마이페이지는 `reservation_orders.user_id`와 `favorite_concerts.user_id`를 기준으로 서버 상태를 구성한다.
