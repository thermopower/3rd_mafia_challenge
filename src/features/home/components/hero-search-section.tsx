"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

interface HeroSearchSectionProps {
  onSearch: (keyword: string) => void;
  initialValue?: string;
}

export const HeroSearchSection = ({
  onSearch,
  initialValue = '',
}: HeroSearchSectionProps) => {
  const [searchKeyword, setSearchKeyword] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchKeyword.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl p-8 md:p-12 shadow-xl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            원하는 공연을 찾아보세요
          </h1>
          <p className="text-white/90 text-sm md:text-base">
            아티스트명이나 공연명으로 검색해보세요
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="공연명 또는 아티스트명을 입력하세요"
              className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-white/20 bg-white/95 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              maxLength={50}
            />
          </div>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
};
