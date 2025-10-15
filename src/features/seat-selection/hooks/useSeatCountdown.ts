"use client";

import { useState, useEffect, useRef } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';

interface UseSeatCountdownOptions {
  expiresAt: string | null;
  onExpire?: () => void;
}

export const useSeatCountdown = ({
  expiresAt,
  onExpire,
}: UseSeatCountdownOptions) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);

  // onExpire 콜백을 ref에 저장하여 dependency 문제 해결
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const now = new Date();
      const expires = parseISO(expiresAt);
      const diff = differenceInSeconds(expires, now);

      if (diff <= 0) {
        setRemainingSeconds(0);
        onExpireRef.current?.();
        return 0;
      }

      setRemainingSeconds(diff);
      return diff;
    };

    // 초기 계산
    const initial = calculateRemaining();
    if (initial <= 0) return;

    // 1초마다 갱신
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [expiresAt]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds <= 0) {
      return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    isExpired: remainingSeconds !== null && remainingSeconds <= 0,
  };
};
