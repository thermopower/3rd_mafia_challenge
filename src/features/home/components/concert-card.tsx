"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Calendar, Users, DollarSign } from 'lucide-react';
import type { ConcertItem } from '@/features/home/lib/dto';
import { cn } from '@/lib/utils';

interface ConcertCardProps {
  concert: ConcertItem;
  onFavoriteToggle?: (concertId: string, isFavorite: boolean) => void;
}

export const ConcertCard = ({ concert, onFavoriteToggle }: ConcertCardProps) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(concert.id, concert.isFavorite);
    }
  };

  const getStatusBadge = () => {
    switch (concert.status) {
      case 'SOLD_OUT':
        return (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            매진
          </div>
        );
      case 'CLOSED':
        return (
          <div className="absolute top-3 left-3 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            종료
          </div>
        );
      default:
        return null;
    }
  };

  const formatPrice = (min: number | null, max: number | null) => {
    if (min === null && max === null) return '가격 미정';
    if (min === max) return `${min?.toLocaleString()}원`;
    return `${min?.toLocaleString()}원 ~ ${max?.toLocaleString()}원`;
  };

  return (
    <Link
      href={`/concerts/${concert.id}`}
      className="group block rounded-lg overflow-hidden border border-slate-200 hover:border-slate-300 transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[4/5.6] bg-slate-100 overflow-hidden">
        {getStatusBadge()}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full transition-all z-10",
            "bg-white/90 hover:bg-white shadow-md",
            concert.isFavorite ? "text-red-500" : "text-slate-400 hover:text-red-500"
          )}
          aria-label={concert.isFavorite ? "찜 취소" : "찜하기"}
        >
          <Heart
            className="w-5 h-5"
            fill={concert.isFavorite ? "currentColor" : "none"}
          />
        </button>

        {/* Thumbnail Image */}
        {!imageError ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}
            <img
              src={concert.thumbnailUrl}
              alt={concert.title}
              className={cn(
                "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                isImageLoading && "opacity-0"
              )}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setImageError(true);
                setIsImageLoading(false);
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-slate-400" />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {concert.title}
        </h3>

        <div className="space-y-1 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span>{formatPrice(concert.minPrice, concert.maxPrice)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              잔여 {concert.availableSeats}석 / 전체 {concert.totalSeats}석
            </span>
          </div>
        </div>

        {/* Availability Bar */}
        <div className="mt-3">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                concert.availableSeats === 0
                  ? "bg-red-500"
                  : concert.availableSeats < concert.totalSeats * 0.3
                  ? "bg-orange-500"
                  : "bg-green-500"
              )}
              style={{
                width: `${
                  concert.totalSeats > 0
                    ? (concert.availableSeats / concert.totalSeats) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};
