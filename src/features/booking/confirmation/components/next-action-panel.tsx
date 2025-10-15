'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { match } from 'ts-pattern';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export const NextActionPanel = () => {
  const router = useRouter();
  const { isAuthenticated } = useCurrentUser();

  const handleMyPage = () => {
    router.push('/mypage');
  };

  const handleReservationLookup = () => {
    router.push('/reservation-lookup');
  };

  const handleHome = () => {
    router.push('/');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {match(isAuthenticated)
            .with(true, () => (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleMyPage}
                >
                  마이페이지로 이동
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleHome}
                >
                  메인으로
                </Button>
              </>
            ))
            .with(false, () => (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleReservationLookup}
                >
                  예매 조회
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleHome}
                >
                  메인으로
                </Button>
              </>
            ))
            .exhaustive()}
        </div>
      </CardContent>
    </Card>
  );
};
