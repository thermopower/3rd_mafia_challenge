-- 좌석 선점 동시성 보장을 위한 제약조건 추가
-- 이 마이그레이션은 여러 사용자가 동시에 같은 좌석을 선점할 때
-- 데이터베이스 레벨에서 중복 선점을 방지합니다.

-- 1. reservation_order_seats 테이블에 활성 상태 좌석에 대한 UNIQUE 제약조건
-- 동일한 좌석(seat_id)에 대해 is_active = true인 레코드는 오직 1개만 존재 가능
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_seat_reservation
ON reservation_order_seats (seat_id)
WHERE is_active = true;

COMMENT ON INDEX idx_active_seat_reservation IS
'좌석 선점 동시성 보장: 활성 상태(is_active=true)인 좌석은 중복 선점 불가';

-- 2. reservation_orders 테이블의 reservation_number에 UNIQUE 제약조건 (이미 존재할 수 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_orders_reservation_number_key'
  ) THEN
    ALTER TABLE reservation_orders
    ADD CONSTRAINT reservation_orders_reservation_number_key
    UNIQUE (reservation_number);
  END IF;
END $$;

COMMENT ON CONSTRAINT reservation_orders_reservation_number_key ON reservation_orders IS
'예약 번호 유일성 보장: 중복 예약 번호 발급 방지';

-- 3. 만료된 선점 자동 해제를 위한 함수 (선택사항 - 백그라운드 작업으로 실행 권장)
CREATE OR REPLACE FUNCTION release_expired_seat_holds()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER;
BEGIN
  -- hold_expires_at 시간이 지난 pending 상태의 주문을 cancelled로 변경
  UPDATE reservation_orders
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE status = 'pending'
    AND hold_expires_at < NOW();

  GET DIAGNOSTICS released_count = ROW_COUNT;

  -- 해당 주문의 좌석 선점 해제
  UPDATE reservation_order_seats
  SET is_active = false,
      updated_at = NOW()
  WHERE order_id IN (
    SELECT id FROM reservation_orders
    WHERE status = 'cancelled'
      AND updated_at >= NOW() - INTERVAL '1 minute'
  )
  AND is_active = true;

  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION release_expired_seat_holds() IS
'만료된 좌석 선점 자동 해제 (크론 작업으로 주기적 실행 권장)';

-- 4. 트랜잭션 격리 수준 확인을 위한 헬퍼 함수
CREATE OR REPLACE FUNCTION check_transaction_isolation()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('transaction_isolation');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_transaction_isolation() IS
'현재 트랜잭션 격리 수준 확인 (READ COMMITTED 또는 REPEATABLE READ 권장)';

-- 5. 좌석 선점 상태 확인을 위한 뷰 (디버깅/모니터링용)
CREATE OR REPLACE VIEW active_seat_holds AS
SELECT
  ro.id as order_id,
  ro.reservation_number,
  ro.status,
  ro.hold_expires_at,
  ros.seat_id,
  cs.seat_label,
  c.title as concert_title,
  CASE
    WHEN ro.hold_expires_at < NOW() THEN 'expired'
    WHEN ro.hold_expires_at >= NOW() THEN 'active'
  END as hold_status,
  EXTRACT(EPOCH FROM (ro.hold_expires_at - NOW())) / 60 as minutes_remaining
FROM reservation_orders ro
JOIN reservation_order_seats ros ON ro.id = ros.order_id
JOIN concert_seats cs ON ros.seat_id = cs.id
JOIN concerts c ON cs.concert_id = c.id
WHERE ros.is_active = true
  AND ro.status = 'pending'
ORDER BY ro.hold_expires_at ASC;

COMMENT ON VIEW active_seat_holds IS
'활성 상태 좌석 선점 현황 (만료 시간 포함)';

-- 6. 동시성 테스트 결과 검증을 위한 함수
CREATE OR REPLACE FUNCTION check_seat_hold_integrity(p_concert_id UUID)
RETURNS TABLE (
  seat_id UUID,
  seat_label TEXT,
  active_hold_count BIGINT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id as seat_id,
    cs.seat_label,
    COUNT(DISTINCT ros.order_id) as active_hold_count,
    COUNT(DISTINCT ros.order_id) <= 1 as is_valid
  FROM concert_seats cs
  LEFT JOIN reservation_order_seats ros ON cs.id = ros.seat_id AND ros.is_active = true
  LEFT JOIN reservation_orders ro ON ros.order_id = ro.id AND ro.status = 'pending'
  WHERE cs.concert_id = p_concert_id
  GROUP BY cs.id, cs.seat_label
  HAVING COUNT(DISTINCT ros.order_id) > 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_seat_hold_integrity(UUID) IS
'좌석 선점 무결성 검증: 중복 선점된 좌석 확인 (결과가 없으면 정상)';
