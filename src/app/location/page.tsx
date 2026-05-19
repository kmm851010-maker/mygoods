'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import { useGPS } from '@/lib/location/gps';
import { reverseGeocode } from '@/lib/location/geocode';
import { useStoredLocation } from '@/lib/hooks/useStoredLocation';
import { MapPin, Navigation, CheckCircle, Trash2 } from 'lucide-react';

export default function LocationPage() {
  const router = useRouter();
  const { location, saveLocation, clearLocation, ready } = useStoredLocation();
  const { coords, loading: gpsLoading, error: gpsError, getLocation } = useGPS();
  const [geocoding, setGeocoding] = useState(false);
  const [preview, setPreview] = useState<{ district: string; address: string } | null>(null);
  const [saved, setSaved] = useState(false);

  // GPS 좌표 얻으면 자동으로 역지오코딩
  useEffect(() => {
    if (!coords) return;
    setGeocoding(true);
    reverseGeocode(coords.lat, coords.lng)
      .then((result) => setPreview(result))
      .catch(() => setPreview(null))
      .finally(() => setGeocoding(false));
  }, [coords]);

  const handleSave = () => {
    if (!coords || !preview) return;
    saveLocation({
      lat: coords.lat,
      lng: coords.lng,
      district: preview.district,
      address: preview.address,
      savedAt: Date.now(),
    });
    setSaved(true);
    setTimeout(() => router.push('/home'), 1000);
  };

  const handleClear = () => {
    clearLocation();
    setPreview(null);
    setSaved(false);
  };

  const loading = gpsLoading || geocoding;

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      <TopBar title="동네 설정" showBack />

      <div className="pt-12 px-4">
        {/* 현재 저장된 위치 */}
        {ready && location && (
          <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">현재 설정된 동네</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <MapPin size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{location.district}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(location.savedAt).toLocaleDateString('ko-KR')} 설정
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                aria-label="삭제"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* GPS 위치 가져오기 */}
        <div className="mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Navigation size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">현재 위치로 설정</p>
              <p className="text-xs text-gray-400">GPS로 내 동네를 자동으로 찾아요</p>
            </div>
          </div>

          {/* 미리보기 */}
          {loading && (
            <div className="flex items-center gap-2 py-3 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              {gpsLoading ? 'GPS 위치 확인 중...' : '주소 변환 중...'}
            </div>
          )}

          {!loading && preview && (
            <div className="bg-orange-50 rounded-xl p-3 mb-4">
              <p className="text-sm font-semibold text-orange-700">{preview.district}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{preview.address}</p>
              {coords && (
                <p className="text-xs text-gray-400 mt-1">
                  정확도: ±{Math.round(coords.accuracy ?? 0)}m
                </p>
              )}
            </div>
          )}

          {!loading && gpsError && (
            <div className="bg-red-50 rounded-xl p-3 mb-4 text-sm text-red-500">
              {gpsError}
            </div>
          )}

          {saved ? (
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 font-semibold text-sm">
              <CheckCircle size={18} />
              저장 완료! 홈으로 이동 중...
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={getLocation}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                <Navigation size={15} />
                {coords ? '다시 가져오기' : 'GPS로 위치 가져오기'}
              </button>
              {preview && coords && (
                <button
                  onClick={handleSave}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors active:scale-[0.98]"
                >
                  이 동네로 설정
                </button>
              )}
            </div>
          )}
        </div>

        {/* 안내 */}
        <div className="mt-4 px-1">
          <p className="text-xs text-gray-400 leading-relaxed">
            • 동네는 최대 2개까지 설정할 수 있어요<br />
            • 설정한 동네 기준으로 상품 피드가 표시됩니다<br />
            • 위치 정보는 기기에만 저장되며 외부로 전송되지 않아요
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
