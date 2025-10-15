"use client";

import { useState, useCallback } from 'react';
import { HeroSearchSection } from './hero-search-section';
import { ConcertGrid } from './concert-grid';
import { HomeSkeleton } from './home-skeleton';
import { useConcertList } from '../hooks/useConcertList';
import { useRecommendedConcerts } from '../hooks/useRecommendedConcerts';
import { useFavoriteToggle } from '@/features/favorites/hooks/useFavoriteToggle';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useAuthModal } from '@/features/auth-modal/hooks/useAuthModal';
import type { ConcertSort } from '../lib/dto';

export const HomePageView = () => {
  const { isAuthenticated } = useCurrentUser();
  const { openModal } = useAuthModal();

  // 검색 및 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOption, setSortOption] = useState<ConcertSort>('latest');
  const [currentPage, setCurrentPage] = useState(1);

  // 공연 목록 조회
  const {
    data: concertListData,
    isLoading: isConcertsLoading,
    isError: isConcertsError,
    error: concertsError,
  } = useConcertList({
    search: searchKeyword || undefined,
    sort: sortOption,
    page: currentPage,
    limit: 20,
  });

  // 추천 공연 조회
  const {
    data: recommendedData,
    isLoading: isRecommendedLoading,
    isError: isRecommendedError,
  } = useRecommendedConcerts();

  // 찜하기 토글
  const favoriteToggle = useFavoriteToggle({
    onSuccess: (isFavorite) => {
      // 성공 알림은 UI 즉시 반영으로 대체
      console.info(isFavorite ? '찜 목록에 추가되었습니다' : '찜 목록에서 제거되었습니다');
    },
    onError: (error) => {
      alert(`찜하기 실패: ${error}`);
    },
    onUnauthorized: () => {
      alert('로그인이 필요한 기능입니다');
      openModal('login');
    },
  });

  // 검색 핸들러
  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1);
  }, []);

  // 정렬 핸들러
  const handleSortChange = useCallback((sort: ConcertSort) => {
    setSortOption(sort);
    setCurrentPage(1);
  }, []);

  // 찜하기 핸들러
  const handleFavoriteToggle = useCallback(
    (concertId: string, isFavorite: boolean) => {
      if (!isAuthenticated) {
        alert('로그인이 필요한 기능입니다');
        openModal('login');
        return;
      }

      favoriteToggle.mutate({ concertId });
    },
    [isAuthenticated, openModal, favoriteToggle]
  );

  // 초기 로딩 상태
  if (isConcertsLoading && !concertListData) {
    return <HomeSkeleton />;
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Search Section */}
        <HeroSearchSection
          onSearch={handleSearch}
          initialValue={searchKeyword}
        />

        {/* Recommended Concerts Section */}
        {!searchKeyword && recommendedData && recommendedData.concerts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">추천 공연</h2>
            </div>
            <ConcertGrid
              concerts={recommendedData.concerts}
              isLoading={isRecommendedLoading}
              isError={isRecommendedError}
              columns={3}
              emptyMessage="추천 공연이 없습니다"
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        )}

        {/* All Concerts Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {searchKeyword ? `"${searchKeyword}" 검색 결과` : '전체 공연'}
            </h2>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-slate-600">
                정렬:
              </label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as ConcertSort)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
                <option value="price_low">낮은 가격순</option>
                <option value="price_high">높은 가격순</option>
              </select>
            </div>
          </div>

          <ConcertGrid
            concerts={concertListData?.concerts || []}
            isLoading={isConcertsLoading}
            isError={isConcertsError}
            error={concertsError as Error}
            emptyMessage={
              searchKeyword
                ? '검색 결과가 없습니다'
                : '등록된 공연이 없습니다'
            }
            columns={4}
            onFavoriteToggle={handleFavoriteToggle}
          />

          {/* Pagination Info */}
          {concertListData && concertListData.concerts.length > 0 && (
            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-slate-600">
                전체 {concertListData.total}개의 공연 중 {concertListData.concerts.length}개 표시
              </p>

              {concertListData.hasMore && (
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isConcertsLoading}
                >
                  더 보기
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
