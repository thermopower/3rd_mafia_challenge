'use client';

import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { useInterval } from 'react-use';

export const useBookingCountdown = (expiresAt?: string) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      setIsExpired(true);
      return;
    }

    const updateRemaining = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = differenceInSeconds(expires, now);

      if (diff <= 0) {
        setRemainingSeconds(0);
        setIsExpired(true);
      } else {
        setRemainingSeconds(diff);
        setIsExpired(false);
      }
    };

    updateRemaining();
  }, [expiresAt]);

  useInterval(
    () => {
      if (!expiresAt) return;

      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = differenceInSeconds(expires, now);

      if (diff <= 0) {
        setRemainingSeconds(0);
        setIsExpired(true);
      } else {
        setRemainingSeconds(diff);
      }
    },
    isExpired ? null : 1000,
  );

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return {
    remainingSeconds,
    isExpired,
    minutes,
    seconds,
    formattedTime: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
};
