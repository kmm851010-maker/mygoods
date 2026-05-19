'use client';

import { useState, useCallback } from 'react';

export type GPSCoords = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export function useGPS() {
  const [coords, setCoords] = useState<GPSCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('위치 서비스가 지원되지 않는 브라우저입니다');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(`위치 권한이 필요합니다: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { coords, error, loading, getLocation };
}
