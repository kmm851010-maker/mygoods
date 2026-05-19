'use client';

import { useState, useEffect } from 'react';
import { useGPS, GPSCoords } from '@/lib/location/gps';
import { reverseGeocode } from '@/lib/location/geocode';

export function useLocation() {
  const { coords, error: gpsError, loading: gpsLoading, getLocation } = useGPS();
  const [district, setDistrict] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!coords) return;
    setGeocoding(true);
    setGeocodeError(null);
    reverseGeocode(coords.lat, coords.lng)
      .then(({ district: d, address: a }) => {
        setDistrict(d);
        setAddress(a);
      })
      .catch(() => setGeocodeError('주소 변환에 실패했습니다'))
      .finally(() => setGeocoding(false));
  }, [coords]);

  return {
    coords,
    district,
    address,
    error: gpsError || geocodeError,
    loading: gpsLoading || geocoding,
    getLocation,
  };
}

export type { GPSCoords };
