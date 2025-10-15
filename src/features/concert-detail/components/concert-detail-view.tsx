"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import type { ConcertDetailResponse } from "@/features/concert-detail/lib/dto";
import { ConcertHeroSection } from "./concert-hero-section";
import { ConcertMetaList } from "./concert-meta-list";
import { PricingTable } from "./pricing-table";
import { ConcertDescription } from "./concert-description";
import { RecommendedConcerts } from "./recommended-concerts";

interface ConcertDetailViewProps {
  concert: ConcertDetailResponse;
}

export const ConcertDetailView = ({ concert }: ConcertDetailViewProps) => {
  const router = useRouter();

  const handleBooking = () => {
    // TODO: 좌석 선택 페이지로 이동
    router.push(`/concerts/${concert.id}/seats`);
  };

  const canBook =
    concert.status === "ON_SALE" || concert.status === "CLOSE_SOON";

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Hero Section */}
          <ConcertHeroSection concert={concert} />

          {/* 2열 그리드 레이아웃 (Desktop: 2열, Mobile: 1열) */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* 왼쪽 열: 메타 정보 + 가격표 */}
            <div className="space-y-6 lg:col-span-1">
              <ConcertMetaList concert={concert} />
              <PricingTable seatCategories={concert.seatCategories} />

              {/* 예매하기 버튼 (모바일에서는 하단에 고정) */}
              <div className="hidden lg:block">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleBooking}
                  disabled={!canBook}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  {canBook ? "예매하기" : "예매 불가"}
                </Button>
              </div>
            </div>

            {/* 오른쪽 열: 상세 설명 */}
            <div className="lg:col-span-2">
              <ConcertDescription concert={concert} />
            </div>
          </div>

          {/* 추천 콘서트 섹션 */}
          <RecommendedConcerts currentConcertId={concert.id} />
        </div>
      </div>

      {/* 모바일 하단 고정 예매 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 lg:hidden">
        <Button
          size="lg"
          className="w-full"
          onClick={handleBooking}
          disabled={!canBook}
        >
          <Calendar className="mr-2 h-5 w-5" />
          {canBook ? "예매하기" : "예매 불가"}
        </Button>
      </div>
    </div>
  );
};
