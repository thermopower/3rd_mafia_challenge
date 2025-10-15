"use client";

import { useEffect } from "react";
import { useUser } from "@/features/common/contexts/user-context";
import { ReservationCard } from "./reservation-card";
import { EmptyState } from "./empty-state";
import { ListSkeleton } from "./list-skeleton";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const ReservationsContent = () => {
  const { state, fetchMyReservations } = useUser();
  const router = useRouter();

  useEffect(() => {
    fetchMyReservations();
  }, [fetchMyReservations]);

  if (state.status === 'loading') {
    return <ListSkeleton count={3} />;
  }

  if (state.myReservations.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="예매 내역이 없습니다"
        description="아직 예매한 공연이 없어요. 원하는 공연을 찾아보세요!"
        actionLabel="공연 둘러보기"
        onAction={() => router.push("/")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {state.myReservations.map((reservation) => (
        <ReservationCard key={reservation.id} reservation={reservation} />
      ))}
    </div>
  );
};

export const ReservationsPanel = () => {
  return <ReservationsContent />;
};
