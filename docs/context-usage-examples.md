# Context 사용 예제

React Context 기반 상태 관리 시스템의 사용법을 소개합니다. 모든 Provider는 `src/app/layout.tsx`에 이미 적용되어 있어, 하위 컴포넌트에서 바로 사용할 수 있습니다.

---

## 1. AuthContext 사용 예제

로그인/로그아웃, 로그인 모달 관리에 사용합니다.

### 기본 사용법

```tsx
"use client";

import { useAuth } from "@/features/common/contexts/auth-context";

export default function LoginButton() {
  const { state, login, logout, openLoginModal } = useAuth();

  if (state.isLoading) {
    return <button disabled>로그인 중...</button>;
  }

  if (state.isLoggedIn) {
    return (
      <div>
        <span>{state.currentUser?.name}님 환영합니다</span>
        <button onClick={logout}>로그아웃</button>
      </div>
    );
  }

  return <button onClick={openLoginModal}>로그인</button>;
}
```

### 로그인 모달 예제

```tsx
"use client";

import { useAuth } from "@/features/common/contexts/auth-context";
import { useState } from "react";

export default function LoginModal() {
  const { state, login, closeLoginModal, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!state.showLoginModal) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>로그인</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {state.error && <p className="error">{state.error}</p>}
          <button type="submit" disabled={state.isLoading}>
            {state.isLoading ? "로그인 중..." : "로그인"}
          </button>
          <button type="button" onClick={closeLoginModal}>
            취소
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 2. ConcertContext 사용 예제

콘서트 목록 조회, 검색, 필터링에 사용합니다.

### 콘서트 목록 페이지

```tsx
"use client";

import { useConcert } from "@/features/common/contexts/concert-context";
import { useEffect } from "react";

export default function ConcertListPage() {
  const { state, fetchConcerts, setSearchTerm, setFilter, clearFilters } =
    useConcert();

  useEffect(() => {
    fetchConcerts();
  }, [fetchConcerts]);

  if (state.status === "loading") {
    return <div>콘서트 목록을 불러오는 중...</div>;
  }

  if (state.status === "error") {
    return <div>오류: {state.error}</div>;
  }

  return (
    <div>
      <h1>콘서트 목록</h1>

      {/* 검색 입력 */}
      <input
        type="text"
        placeholder="콘서트 검색"
        value={state.searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* 필터 버튼 */}
      <div>
        <button onClick={() => setFilter({ genre: "rock" })}>Rock</button>
        <button onClick={() => setFilter({ genre: "pop" })}>Pop</button>
        <button onClick={clearFilters}>필터 초기화</button>
      </div>

      {/* 검색된 콘서트 목록 */}
      <div>
        {state.filteredConcerts.length === 0 ? (
          <p>검색 결과가 없습니다.</p>
        ) : (
          state.filteredConcerts.map((concert) => (
            <div key={concert.id}>
              <h3>{concert.title}</h3>
              <p>ID: {concert.id}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 3. BookingContext 사용 예제

좌석 선택부터 예매 완료까지의 예매 플로우에 사용합니다.

### 좌석 선택 페이지

```tsx
"use client";

import { useBooking } from "@/features/common/contexts/booking-context";
import { useEffect } from "react";

export default function SeatSelectionPage({ concertId }: { concertId: string }) {
  const { state, startBooking, selectSeat, deselectSeat } = useBooking();

  useEffect(() => {
    startBooking(concertId, "제미니 콘서트");
  }, [concertId, startBooking]);

  if (state.status === "loading") {
    return <div>좌석 정보를 불러오는 중...</div>;
  }

  if (state.status === "error") {
    return <div>오류: {state.error}</div>;
  }

  return (
    <div>
      <h1>{state.concertInfo?.name} - 좌석 선택</h1>

      <div>
        <h2>선택된 좌석 ({state.selectedSeats.length}개)</h2>
        {state.selectedSeats.map((seat) => (
          <div key={seat.id}>
            {seat.seatLabel}
            <button onClick={() => deselectSeat(seat.id)}>취소</button>
          </div>
        ))}
      </div>

      <div>
        <h2>전체 좌석</h2>
        {state.allSeats.map((seat) => {
          const isSelected = state.selectedSeats.some((s) => s.id === seat.id);
          return (
            <button
              key={seat.id}
              onClick={() => (isSelected ? deselectSeat(seat.id) : selectSeat(seat))}
              className={isSelected ? "selected" : ""}
            >
              {seat.seatLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### 예매 확정 페이지

```tsx
"use client";

import { useBooking } from "@/features/common/contexts/booking-context";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookingConfirmPage() {
  const { state, confirmBooking, resetBooking } = useBooking();
  const [bookerName, setBookerName] = useState("");
  const [bookerContact, setBookerContact] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await confirmBooking({ bookerName, bookerContact });

    if (state.status === "success") {
      router.push("/booking-complete");
    }
  };

  return (
    <div>
      <h1>예매 정보 입력</h1>

      <div>
        <h2>선택된 좌석</h2>
        {state.selectedSeats.map((seat) => (
          <div key={seat.id}>{seat.seatLabel}</div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="예매자 이름"
          value={bookerName}
          onChange={(e) => setBookerName(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="연락처"
          value={bookerContact}
          onChange={(e) => setBookerContact(e.target.value)}
          required
        />

        {state.error && <p className="error">{state.error}</p>}

        <button type="submit" disabled={state.status === "confirming"}>
          {state.status === "confirming" ? "예매 중..." : "예매 확정"}
        </button>
        <button type="button" onClick={resetBooking}>
          취소
        </button>
      </form>
    </div>
  );
}
```

---

## 4. UserContext 사용 예제

마이페이지, 찜 목록, 알림 등 개인화 데이터 관리에 사용합니다.

### 마이페이지

```tsx
"use client";

import { useUser } from "@/features/common/contexts/user-context";
import { useEffect } from "react";

export default function MyPage() {
  const { state, fetchUserData } = useUser();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (state.status === "loading") {
    return <div>데이터를 불러오는 중...</div>;
  }

  if (state.status === "error") {
    return <div>오류: {state.error}</div>;
  }

  return (
    <div>
      <h1>마이페이지</h1>

      <section>
        <h2>내 예매 내역 ({state.myBookings.length}건)</h2>
        {state.myBookings.map((booking) => (
          <div key={booking.id}>
            <p>예매 번호: {booking.reservationNumber}</p>
            <p>상태: {booking.status}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>찜한 콘서트 ({state.wishlist.length}개)</h2>
        {state.wishlist.map((concert) => (
          <div key={concert.id}>
            <h3>{concert.title}</h3>
          </div>
        ))}
      </section>
    </div>
  );
}
```

### 찜하기 버튼

```tsx
"use client";

import { useUser } from "@/features/common/contexts/user-context";
import type { Concert } from "@/features/common/types";

export default function WishlistButton({ concert }: { concert: Concert }) {
  const { state, toggleWishlist } = useUser();

  const isInWishlist = state.wishlist.some((c) => c.id === concert.id);

  return (
    <button onClick={() => toggleWishlist(concert)}>
      {isInWishlist ? "찜 해제" : "찜하기"}
    </button>
  );
}
```

### 알림 표시

```tsx
"use client";

import { useUser } from "@/features/common/contexts/user-context";

export default function NotificationBell() {
  const { state, readNotification } = useUser();

  return (
    <div>
      <button className={state.hasNewNotification ? "has-notification" : ""}>
        알림 ({state.notifications.length})
      </button>

      <div className="notification-list">
        {state.notifications.map((notif) => (
          <div
            key={notif.id}
            className={notif.isRead ? "read" : "unread"}
            onClick={() => readNotification(notif.id)}
          >
            <h4>{notif.title}</h4>
            <p>{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. 통합 사용 예제

여러 Context를 함께 사용하는 복합 시나리오입니다.

### 콘서트 상세 페이지 (인증 + 찜하기)

```tsx
"use client";

import { useAuth } from "@/features/common/contexts/auth-context";
import { useUser } from "@/features/common/contexts/user-context";
import type { Concert } from "@/features/common/types";

export default function ConcertDetailPage({ concert }: { concert: Concert }) {
  const { state: authState, openLoginModal } = useAuth();
  const { state: userState, toggleWishlist } = useUser();

  const handleWishlistClick = () => {
    if (!authState.isLoggedIn) {
      openLoginModal();
      return;
    }
    toggleWishlist(concert);
  };

  const isInWishlist = userState.wishlist.some((c) => c.id === concert.id);

  return (
    <div>
      <h1>{concert.title}</h1>

      <button onClick={handleWishlistClick}>
        {isInWishlist ? "찜 해제" : "찜하기"}
      </button>

      <button>예매하기</button>
    </div>
  );
}
```

---

## 요약

- **AuthContext**: 로그인/로그아웃, 모달 관리
- **ConcertContext**: 콘서트 목록, 검색/필터
- **BookingContext**: 예매 플로우 전체 관리
- **UserContext**: 마이페이지, 찜, 알림

모든 Context는 `useReducer`를 통해 상태 로직을 관리하며, 타입 안정성이 보장됩니다.
