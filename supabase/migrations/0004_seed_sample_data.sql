-- Migration: seed sample concert and reservation data derived from docs requirements and use cases
-- References:
--   - docs/database.md (도메인 스키마 및 컬럼 설명)
--   - docs/pages/home/plan.md (콘서트 카드 및 썸네일 요구)
--   - docs/usecases/005/spec.md (좌석 등급/가격 시나리오)
--   - docs/requirement.md (콘서트/예약 데이터 필수 필드)

DO $$
DECLARE
  v_concert_summer uuid := 'c7ca0f90-6d2a-4e91-8e85-72a19cf4cff8';
  v_concert_jazz uuid := 'f3f5f2b4-3f10-4f66-9b2a-7a3f1b2c4d5e';
  v_concert_rock uuid := 'a2b5d00a-9e89-4c61-9a54-97fbf0f2a81c';
BEGIN
  -- Concert master data
  INSERT INTO public.concerts (
    id,
    title,
    artist,
    description,
    venue_name,
    venue_address,
    start_date,
    end_date,
    duration_minutes,
    age_rating,
    notice,
    thumbnail_url,
    status,
    created_at,
    updated_at
  )
  VALUES
    (
      v_concert_summer,
      '썸머 나잇 인 서울 2025',
      'Various Artists',
      '여름 밤을 수놓는 일렉트로닉 & 팝 라인업이 이틀간 펼쳐지는 야외 페스티벌입니다.',
      '서울월드컵경기장',
      '서울특별시 마포구 월드컵로 240',
      '2025-08-15T17:00:00+09'::timestamptz,
      '2025-08-16T22:00:00+09'::timestamptz,
      150,
      'ALL',
      '야외 공연으로 우천 시 우비가 제공됩니다.',
      'https://picsum.photos/seed/summer-night-seoul/640/480',
      'ON_SALE',
      NOW(),
      NOW()
    ),
    (
      v_concert_jazz,
      '미드나잇 재즈 라운지 2025',
      'Seoul Jazz Ensemble',
      '클래식과 퓨전 재즈를 넘나드는 밤 시간대 전용 라운지 콘서트입니다.',
      '롯데콘서트홀',
      '서울특별시 송파구 올림픽로 300',
      '2025-11-01T19:30:00+09'::timestamptz,
      '2025-11-01T21:30:00+09'::timestamptz,
      120,
      '15+',
      '착석 공연으로 음료 반입은 제한됩니다.',
      'https://picsum.photos/seed/midnight-jazz-2025/640/480',
      'CLOSE_SOON',
      NOW(),
      NOW()
    ),
    (
      v_concert_rock,
      '록 킹덤 리유니온 2025',
      'Rock Kingdom All Stars',
      '전설적인 락 밴드가 한 무대에서 펼치는 단 하루의 리유니온 공연입니다.',
      '고척스카이돔',
      '서울특별시 구로구 경인로 430',
      '2025-07-05T18:00:00+09'::timestamptz,
      '2025-07-05T21:30:00+09'::timestamptz,
      210,
      '12+',
      '스탠딩 구역은 입장 순서대로 배정되며, 팔찌 착용 필수입니다.',
      'https://picsum.photos/seed/rock-kingdom-2025/640/480',
      'SOLD_OUT',
      NOW(),
      NOW()
    )
  ON CONFLICT (id) DO UPDATE
  SET
    title = EXCLUDED.title,
    artist = EXCLUDED.artist,
    description = EXCLUDED.description,
    venue_name = EXCLUDED.venue_name,
    venue_address = EXCLUDED.venue_address,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    duration_minutes = EXCLUDED.duration_minutes,
    age_rating = EXCLUDED.age_rating,
    notice = EXCLUDED.notice,
    thumbnail_url = EXCLUDED.thumbnail_url,
    status = EXCLUDED.status,
    updated_at = NOW(),
    created_at = public.concerts.created_at;

  -- Seat categories derived from pricing tiers in docs/usecases specifications
  INSERT INTO public.concert_seat_categories (
    id,
    concert_id,
    name,
    description,
    display_color,
    price,
    total_seats,
    created_at,
    updated_at
  )
  VALUES
    ('5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf', v_concert_summer, 'VIP', '무대 정면 1~2열, 리미티드 패키지 포함', '#FFD700', 220000, 6, NOW(), NOW()),
    ('9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', v_concert_summer, 'R', '센터 블록 3~6열, 개별 등받이 좌석', '#FF8A00', 165000, 8, NOW(), NOW()),
    ('8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', v_concert_summer, 'S', '사이드 블록 1~5열, 전용 출입구 이용', '#36A2EB', 99000, 10, NOW(), NOW()),
    ('a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba', v_concert_jazz, 'Premium', '풀밴드가 보이는 중앙 1층 블록', '#BF4FFF', 180000, 6, NOW(), NOW()),
    ('4650d44a-1efe-4e42-b3b4-345962f8d833', v_concert_jazz, 'Standard', '2층 발코니 전석, 음향 최적화 구역', '#4ADE80', 120000, 10, NOW(), NOW()),
    ('1c2a77c1-d78f-43c4-bfdd-cd14470f700a', v_concert_rock, 'Floor', '스탠딩 플로어 구역, 무대 밀착', '#F97316', 198000, 8, NOW(), NOW()),
    ('51419f44-8aae-4093-8bbc-6d67e94ece66', v_concert_rock, 'Stand', '1층 스탠드 지정 좌석, 정면 시야', '#38BDF8', 138000, 8, NOW(), NOW()),
    ('d215a023-7dfb-4108-9234-54796a5245a7', v_concert_rock, 'Balcony', '2층 발코니, 단차형 좌석', '#A855F7', 88000, 6, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_color = EXCLUDED.display_color,
    price = EXCLUDED.price,
    total_seats = EXCLUDED.total_seats,
    updated_at = NOW(),
    created_at = public.concert_seat_categories.created_at;

  -- Seat inventory aligned with category total_seats metadata
  INSERT INTO public.concert_seats (id, concert_id, category_id, seat_label, created_at, updated_at)
  VALUES
    -- Summer Night VIP
    ('1ce9f8aa-56bc-4a65-9ddf-19e78146f7b0', v_concert_summer, '5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf', 'A-01', NOW(), NOW()),
    ('0093bcd4-10d6-4a41-a791-2414680d2539', v_concert_summer, '5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf', 'A-02', NOW(), NOW()),
    ('7d386327-3d3b-4e0d-9a03-3503b102ae57', v_concert_summer, '5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf', 'A-03', NOW(), NOW()),
    ('b6004a32-18a0-4f5a-a4f5-c4ac2740d37c', v_concert_summer, '5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf', 'A-04', NOW(), NOW()),
    ('14b59c3d-6eda-4e5f-96ca-20b12c90ebcd', v_concert_summer, '5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf', 'A-05', NOW(), NOW()),
    ('9a33f93f-3b48-41a6-8514-76174fd9b383', v_concert_summer, '5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf', 'A-06', NOW(), NOW()),
    -- Summer Night R
    ('55b0b98b-4a06-4cf2-8cc4-473c961cc9e8', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-01', NOW(), NOW()),
    ('2c2744f5-9ad5-4ade-840f-77b4880daf0c', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-02', NOW(), NOW()),
    ('9cce44c7-3a2d-4a7d-8201-4e6d7eb5a5c2', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-03', NOW(), NOW()),
    ('196edc3e-9df2-4461-ab50-3c49c5cdb760', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-04', NOW(), NOW()),
    ('b3afed4a-4fc2-4c52-83b1-701ddd55f5d0', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-05', NOW(), NOW()),
    ('f68ce182-a230-4fc2-a0f5-96114851771f', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-06', NOW(), NOW()),
    ('8bfc3445-67fe-4ca5-9ba2-0d9ba09dd474', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-07', NOW(), NOW()),
    ('c7431a0a-8f59-449a-ad1d-a3f5891b2ade', v_concert_summer, '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1', 'B-08', NOW(), NOW()),
    -- Summer Night S
    ('804d6f81-cf20-4f99-a7d8-8a53ce38afcb', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-01', NOW(), NOW()),
    ('281955a4-40d8-4093-9458-5517b8f56b0a', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-02', NOW(), NOW()),
    ('d12f77f6-c201-4d71-8f6e-dd5bb58b2f1f', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-03', NOW(), NOW()),
    ('f6808ba0-db7d-4b74-95cb-08713e0bbdfe', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-04', NOW(), NOW()),
    ('373ea88a-1f1a-4817-8857-b12c90ebaba4', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-05', NOW(), NOW()),
    ('a1a17db3-fc06-4d3b-8c91-6c649e3faba1', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-06', NOW(), NOW()),
    ('fb0910e0-0b10-4529-8bac-1ec66f64fdfd', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-07', NOW(), NOW()),
    ('0cfcee1c-66b4-40d4-9d53-d6af74e6a1cc', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-08', NOW(), NOW()),
    ('b758f864-fcd9-4fc8-aa65-7bce49963cf0', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-09', NOW(), NOW()),
    ('af8abf9e-01bf-4adf-bdbc-76e8a4591d30', v_concert_summer, '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78', 'C-10', NOW(), NOW()),
    -- Midnight Jazz Premium
    ('62d567f0-0b08-4fff-ba77-963ff0e7a221', v_concert_jazz, 'a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba', 'P-01', NOW(), NOW()),
    ('a8e0c984-a0bc-4ea4-b8ae-4a0e7f2117d2', v_concert_jazz, 'a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba', 'P-02', NOW(), NOW()),
    ('cab25481-410a-4b4e-9a25-b2d0f7c7c1f5', v_concert_jazz, 'a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba', 'P-03', NOW(), NOW()),
    ('4f329565-a0d2-44ce-a6a8-cdb8da1d2a8f', v_concert_jazz, 'a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba', 'P-04', NOW(), NOW()),
    ('0c12c2f0-bc2a-4b4e-8fbe-a77b0df3157c', v_concert_jazz, 'a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba', 'P-05', NOW(), NOW()),
    ('b423a1ea-3af6-4d68-9bb2-daae4a3b6ac7', v_concert_jazz, 'a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba', 'P-06', NOW(), NOW()),
    -- Midnight Jazz Standard
    ('a1f989e5-5c10-49bd-8f22-70c3d07258b5', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-01', NOW(), NOW()),
    ('9d11e03f-1d5c-4a93-8fab-7bcb6d6d0ecc', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-02', NOW(), NOW()),
    ('f9f1cbb0-7aec-4a78-8a2e-cb1d0b5dd01b', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-03', NOW(), NOW()),
    ('4d5b5e7a-6022-4a4a-bcd5-62d2f0d4a1cc', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-04', NOW(), NOW()),
    ('85782c73-52d4-4a6a-9569-5e4ddf638c71', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-05', NOW(), NOW()),
    ('023b32ea-b8c6-4479-8bb2-366f4a1f6d88', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-06', NOW(), NOW()),
    ('c41dc8af-0a4e-40d7-ad6e-28af6574d266', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-07', NOW(), NOW()),
    ('e849f466-335f-4f55-897b-587c40e24a98', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-08', NOW(), NOW()),
    ('415168fe-641d-4e03-849f-0ef8f137aaca', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-09', NOW(), NOW()),
    ('e5b8af47-3bca-4bec-9cf1-999119f7a5f6', v_concert_jazz, '4650d44a-1efe-4e42-b3b4-345962f8d833', 'ST-10', NOW(), NOW()),
    -- Rock Kingdom Floor
    ('f63a1403-4df8-4cc1-bd5e-1cf2e7a9e33f', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-01', NOW(), NOW()),
    ('e4f10495-01fa-486b-9967-4c1af9da6af9', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-02', NOW(), NOW()),
    ('21a2c160-9c1a-4b9c-aa62-1557e2d5aeff', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-03', NOW(), NOW()),
    ('8d03a22b-3e46-4cd0-95d9-2c850f49c76d', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-04', NOW(), NOW()),
    ('855c0443-93ab-443e-9ef3-3c0abba1f991', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-05', NOW(), NOW()),
    ('f946e3fd-0634-43aa-9926-601ea368b7d8', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-06', NOW(), NOW()),
    ('9bcfe417-8f69-4cf9-a60e-6e6c6a8d88ef', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-07', NOW(), NOW()),
    ('b362bcb8-35b6-4eae-a1b7-6d4b33b22a6d', v_concert_rock, '1c2a77c1-d78f-43c4-bfdd-cd14470f700a', 'F-08', NOW(), NOW()),
    -- Rock Kingdom Stand
    ('dcf9eb52-46d1-4e9b-9d60-f505d1a6a476', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-01', NOW(), NOW()),
    ('6ad3de21-0465-4b38-8a05-5f96365e6a6e', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-02', NOW(), NOW()),
    ('6a5981aa-4100-4f59-8403-d9403f5f1b33', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-03', NOW(), NOW()),
    ('9eafaf0f-80bd-451c-875f-1911091cf07b', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-04', NOW(), NOW()),
    ('bc47d997-19ab-4c9a-a904-39fd9e07d579', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-05', NOW(), NOW()),
    ('9fb01785-25a4-413d-8ffd-f9a8a5d22c12', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-06', NOW(), NOW()),
    ('5ae3442f-8cd6-41a4-87d5-193ae0bdc7b4', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-07', NOW(), NOW()),
    ('b5c6bccb-d19c-4ef6-a9d3-1bdf0c1e47e4', v_concert_rock, '51419f44-8aae-4093-8bbc-6d67e94ece66', 'STAND-08', NOW(), NOW()),
    -- Rock Kingdom Balcony
    ('66327d76-1a93-4a3c-858a-050315a7d26c', v_concert_rock, 'd215a023-7dfb-4108-9234-54796a5245a7', 'B-01', NOW(), NOW()),
    ('5b17f4ed-5df5-476c-93eb-1aef3c8c05ea', v_concert_rock, 'd215a023-7dfb-4108-9234-54796a5245a7', 'B-02', NOW(), NOW()),
    ('9aa2d1bb-f5f6-4d5c-8b42-8d0b7f4c1b8d', v_concert_rock, 'd215a023-7dfb-4108-9234-54796a5245a7', 'B-03', NOW(), NOW()),
    ('e4108444-1a4a-41b5-9a1b-8eec77151a13', v_concert_rock, 'd215a023-7dfb-4108-9234-54796a5245a7', 'B-04', NOW(), NOW()),
    ('2d46bce7-4b56-4d88-b4ab-64e3f873eb19', v_concert_rock, 'd215a023-7dfb-4108-9234-54796a5245a7', 'B-05', NOW(), NOW()),
    ('3c95ffdd-9c4e-4dcb-9a36-9f4a9a6425cf', v_concert_rock, 'd215a023-7dfb-4108-9234-54796a5245a7', 'B-06', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET
    seat_label = EXCLUDED.seat_label,
    category_id = EXCLUDED.category_id,
    concert_id = EXCLUDED.concert_id,
    updated_at = NOW(),
    created_at = public.concert_seats.created_at;

  -- Synchronise category seat counts to the actual inventory
  UPDATE public.concert_seat_categories AS c
  SET
    total_seats = counts.seat_count,
    updated_at = NOW()
  FROM (
    SELECT category_id, COUNT(*) AS seat_count
    FROM public.concert_seats
    WHERE category_id IN (
      '5d1e9f4d-3c8a-4f18-b0ed-91d34d8321cf',
      '9b0f6a22-2325-4a5e-ae12-4cf45f8d0cb1',
      '8c6d12f4-fc1e-43f8-9f59-e96b86c09f78',
      'a7d4b49f-1a4a-45c8-b3b3-5c9230e650ba',
      '4650d44a-1efe-4e42-b3b4-345962f8d833',
      '1c2a77c1-d78f-43c4-bfdd-cd14470f700a',
      '51419f44-8aae-4093-8bbc-6d67e94ece66',
      'd215a023-7dfb-4108-9234-54796a5245a7'
    )
    GROUP BY category_id
  ) AS counts
  WHERE c.id = counts.category_id;

  -- Sample reservation orders illustrating both 비회원과 확정된 주문 흐름
  INSERT INTO public.reservation_orders (
    id,
    reservation_number,
    concert_id,
    user_id,
    status,
    hold_expires_at,
    confirmed_at,
    booker_name,
    booker_contact,
    total_price,
    created_at,
    updated_at
  )
  VALUES
    (
      'b087bba2-1352-4a1c-b7e7-7f9e0f6adac3',
      'TG2025-0001',
      v_concert_summer,
      NULL,
      'pending',
      '2025-08-15T16:40:00+09'::timestamptz,
      NULL,
      '박민서',
      '010-1234-5678',
      330000,
      '2025-08-10T10:00:00+09'::timestamptz,
      '2025-08-10T10:00:00+09'::timestamptz
    ),
    (
      'a87c2925-e1d6-4b71-93c2-7cf0a1d6f4cb',
      'TG2025-0002',
      v_concert_jazz,
      NULL,
      'confirmed',
      NULL,
      '2025-09-10T21:10:00+09'::timestamptz,
      '이서준',
      '010-9876-5432',
      360000,
      '2025-09-10T19:20:00+09'::timestamptz,
      '2025-09-10T21:10:00+09'::timestamptz
    )
  ON CONFLICT (id) DO UPDATE
  SET
    reservation_number = EXCLUDED.reservation_number,
    concert_id = EXCLUDED.concert_id,
    user_id = EXCLUDED.user_id,
    status = EXCLUDED.status,
    hold_expires_at = EXCLUDED.hold_expires_at,
    confirmed_at = EXCLUDED.confirmed_at,
    booker_name = EXCLUDED.booker_name,
    booker_contact = EXCLUDED.booker_contact,
    total_price = EXCLUDED.total_price,
    updated_at = EXCLUDED.updated_at,
    created_at = public.reservation_orders.created_at;

  INSERT INTO public.reservation_order_seats (
    id,
    order_id,
    seat_id,
    price,
    is_active,
    created_at
  )
  VALUES
    ('cc2a5ca4-720a-4dae-acf0-a2ff6a5e672d', 'b087bba2-1352-4a1c-b7e7-7f9e0f6adac3', '55b0b98b-4a06-4cf2-8cc4-473c961cc9e8', 165000, TRUE, '2025-08-10T10:00:00+09'::timestamptz),
    ('2f4e7115-f487-4ccf-8c2c-68d4c8d08085', 'b087bba2-1352-4a1c-b7e7-7f9e0f6adac3', '2c2744f5-9ad5-4ade-840f-77b4880daf0c', 165000, TRUE, '2025-08-10T10:00:00+09'::timestamptz),
    ('a5edc1a0-2d4e-4f0a-8d0c-888313d7e0d0', 'a87c2925-e1d6-4b71-93c2-7cf0a1d6f4cb', '62d567f0-0b08-4fff-ba77-963ff0e7a221', 180000, TRUE, '2025-09-10T19:20:00+09'::timestamptz),
    ('e424088c-8bfc-4b91-9d46-25f433d0c3fa', 'a87c2925-e1d6-4b71-93c2-7cf0a1d6f4cb', 'a8e0c984-a0bc-4ea4-b8ae-4a0e7f2117d2', 180000, TRUE, '2025-09-10T19:20:00+09'::timestamptz)
  ON CONFLICT (id) DO UPDATE
  SET
    order_id = EXCLUDED.order_id,
    seat_id = EXCLUDED.seat_id,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active,
    created_at = public.reservation_order_seats.created_at;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

