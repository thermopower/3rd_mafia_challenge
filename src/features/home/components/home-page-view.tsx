"use client";

import { useEffect, useCallback } from 'react';
import { HomeHeader } from './home-header';
import { HeroSearchSection } from './hero-search-section';
import { ConcertGrid } from './concert-grid';
import { HomeSkeleton } from './home-skeleton';
import { useConcert } from '@/features/common/contexts/concert-context';
import { useUser } from '@/features/common/contexts/user-context';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useAuth } from '@/features/common/contexts/auth-context';
import type { ConcertSort } from '../lib/dto';

export const HomePageView = () => {
  const { isAuthenticated } = useCurrentUser();
  const { openAuthModal } = useAuth();
  const {
    state: concertState,
    fetchConcerts,
    fetchRecommendedConcerts,
    setSearchTerm,
    setFilter,
    clearFilters,
  } = useConcert();
  const { toggleFavorite } = useUser();

  // 초기 데이터 로드
  useEffect(() => {
    fetchConcerts();
    fetchRecommendedConcerts();
  }, [fetchConcerts, fetchRecommendedConcerts]);

  // 검색 핸들러
  const handleSearch = useCallback((keyword: string) => {
    setSearchTerm(keyword);
    fetchConcerts({ search: keyword, page: 1 });
  }, [setSearchTerm, fetchConcerts]);

  // 정렬 핸들러
  const handleSortChange = useCallback((sort: ConcertSort) => {
    setFilter({ sort });
    fetchConcerts({ sort, page: 1 });
  }, [setFilter, fetchConcerts]);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback(() => {
    const nextPage = concertState.pagination.page + 1;
    fetchConcerts({ page: nextPage });
  }, [concertState.pagination.page, fetchConcerts]);

  // 찜하기 핸들러
  const handleFavoriteToggle = useCallback(
    async (concertId: string, isFavorite: boolean) => {
      if (!isAuthenticated) {
        alert('로그인이 필요한 기능입니다');
        openAuthModal('login');
        return;
      }

      try {
        await toggleFavorite(concertId);
        console.info(isFavorite ? '찜 목록에서 제거되었습니다' : '찜 목록에 추가되었습니다');
      } catch (error) {
        alert(`찜하기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    },
    [isAuthenticated, openAuthModal, toggleFavorite]
  );

  // 초기 로딩 상태
  if (concertState.status === 'loading' && concertState.allConcerts.length === 0) {
    return <HomeSkeleton />;
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <HomeHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Search Section */}
        <HeroSearchSection
          onSearch={handleSearch}
          initialValue={concertState.searchTerm}
        />

        {/* Recommended Concerts Section */}
        {!concertState.searchTerm && concertState.recommendedConcerts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">추천 공연</h2>
            </div>
            <ConcertGrid
              concerts={concertState.recommendedConcerts}
              isLoading={false}
              isError={false}
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
              {concertState.searchTerm ? `"${concertState.searchTerm}" 검색 결과` : '전체 공연'}
            </h2>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-slate-600">
                정렬:
              </label>
              <select
                id="sort"
                value={concertState.activeFilters.sort || 'latest'}
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
            concerts={concertState.filteredConcerts}
            isLoading={concertState.status === 'loading'}
            isError={concertState.status === 'error'}
            error={concertState.error ? new Error(concertState.error) : undefined}
            emptyMessage={
              concertState.searchTerm
                ? '검색 결과가 없습니다'
                : '등록된 공연이 없습니다'
            }
            columns={4}
            onFavoriteToggle={handleFavoriteToggle}
          />

          {/* Pagination Info */}
          {concertState.filteredConcerts.length > 0 && (
            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-slate-600">
                전체 {concertState.pagination.total}개의 공연 중 {concertState.filteredConcerts.length}개 표시
              </p>

              {concertState.pagination.hasMore && (
                <button
                  type="button"
                  onClick={handlePageChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={concertState.status === 'loading'}
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
