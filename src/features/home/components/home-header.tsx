"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogIn, Search, User, LogOut } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Button } from '@/components/ui/button';

export const HomeHeader = () => {
  const { isAuthenticated, user } = useCurrentUser();
  const { mutate: logout } = useLogout();
  const router = useRouter();
  const pathname = usePathname();

  const handleLoginClick = () => {
    router.push(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
  };

  const handleLogoutClick = () => {
    logout();
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Site Name */}
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-blue-600">TicketGem</h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {/* 예약 조회 링크 */}
            <Link
              href="/reservations/lookup"
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>예약 조회</span>
            </Link>

            {/* 로그인/로그아웃 버튼 */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* 마이페이지 링크 */}
                <Link
                  href="/mypage"
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>마이페이지</span>
                </Link>

                {/* 로그아웃 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleLoginClick}
                className="flex items-center space-x-1"
              >
                <LogIn className="w-4 h-4" />
                <span>로그인</span>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
