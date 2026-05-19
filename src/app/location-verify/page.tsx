'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLocation } from '@/lib/hooks/useLocation';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import { MapPin, CheckCircle, XCircle, Navigation } from 'lucide-react';

export default function LocationVerifyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { coords, district, address, loading, error, getLocation } = useLocation();
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; district: string } | null>(null);

  useEffect(() => {
    if (!user) router.replace('/splash');
  }, [user, router]);

  const handleVerify = async () => {
    if (!coords) {
      getLocation();
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/location/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          inputAddress: district,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({ verified: data.verified, district: data.district });
      } else {
        alert('위치 검증에 실패했습니다');
      }
    } catch {
      alert('오류가 발생했습니다');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-full bg-white pb-20">
      <TopBar title="위치 인증" showBack />

      <div className="pt-12 px-4">
        {/* Map placeholder */}
        <div className="mt-4 w-full aspect-[4/3] bg-gray-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
          {coords ? (
            <div className="flex flex-col items-center text-gray-500">
              <MapPin size={40} className="text-orange-500 mb-2" />
              <p className="text-sm font-medium">{district || '위치 확인됨'}</p>
              <p className="text-xs text-gray-400 mt-1">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
              {coords.accuracy && (
                <p className="text-xs text-gray-400">정확도: ±{Math.round(coords.accuracy)}m</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <Navigation size={40} className="mb-2" />
              <p className="text-sm">위치 정보가 없습니다</p>
            </div>
          )}
        </div>

        {/* Address info */}
        <div className="mt-5 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">현재 위치</p>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">위치 확인 중...</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : coords ? (
            <div>
              <p className="text-base font-semibold text-gray-900">{district || '알 수 없는 위치'}</p>
              {address && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{address}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-400">위치를 불러와주세요</p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
              result.verified ? 'bg-emerald-50' : 'bg-red-50'
            }`}
          >
            {result.verified ? (
              <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle size={24} className="text-red-400 flex-shrink-0" />
            )}
            <div>
              <p
                className={`text-sm font-semibold ${
                  result.verified ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {result.verified ? '위치 인증 완료!' : '위치 인증 실패'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {result.verified
                  ? `${result.district} 인증 완료 (24시간 유효)`
                  : '입력한 주소와 GPS 위치가 일치하지 않습니다'}
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-5 p-4 bg-orange-50 rounded-xl">
          <p className="text-xs font-semibold text-orange-700 mb-1">위치 인증이란?</p>
          <ul className="space-y-1">
            {[
              'GPS로 실제 위치를 검증해 허위 등록을 방지합니다',
              '인증 후 24시간 동안 "위치인증" 배지가 표시됩니다',
              '구매자와 판매자 모두 안심하고 거래할 수 있어요',
            ].map((text) => (
              <li key={text} className="flex items-start gap-1.5 text-xs text-orange-600">
                <span className="mt-0.5">•</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {!coords && (
            <button
              onClick={getLocation}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? '위치 확인 중...' : 'GPS 위치 가져오기'}
            </button>
          )}
          <button
            onClick={handleVerify}
            disabled={!coords || verifying || loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {verifying ? '검증 중...' : '위치 인증하기'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
