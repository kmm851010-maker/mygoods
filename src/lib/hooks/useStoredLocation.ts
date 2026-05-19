'use client';

import { useState, useEffect, useCallback } from 'react';

export type StoredLocation = {
  lat: number;
  lng: number;
  district: string;
  address: string;
  savedAt: number;
};

const STORAGE_KEY = 'mg_location';

export function useStoredLocation() {
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLocation(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const saveLocation = useCallback((loc: StoredLocation) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    setLocation(loc);
  }, []);

  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocation(null);
  }, []);

  return { location, saveLocation, clearLocation, ready };
}
