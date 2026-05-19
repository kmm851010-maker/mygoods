'use client';

import { MapPin, Navigation, X } from 'lucide-react';

interface LocationPermissionModalProps {
  onAllow: () => void;
  onDeny: () => void;
}

export default function LocationPermissionModal({ onAllow, onDeny }: LocationPermissionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl px-6 pt-6 pb-10 animate-slide-up">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Navigation size={30} className="text-orange-500" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 text-center">위치 접근 허용</h2>
        <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
          내 주변 중고 상품을 보려면<br />
          현재 위치 접근이 필요해요
        </p>

        <ul className="mt-5 space-y-3">
          {[
            { icon: MapPin, text: '내 주변 상품 피드 표시' },
            { icon: MapPin, text: '판매자까지 거리 계산' },
            { icon: MapPin, text: '동네 인증 배지 발급' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-orange-400" />
              </div>
              {text}
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-400 text-center mt-4">
          위치 정보는 서버에 저장되지 않으며 브라우저에만 보관됩니다
        </p>

        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={onAllow}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-sm active:scale-[0.98] transition-all"
          >
            위치 접근 허용
          </button>
          <button
            onClick={onDeny}
            className="w-full text-gray-400 py-3 text-sm hover:text-gray-600"
          >
            나중에 설정하기
          </button>
        </div>
      </div>
    </div>
  );
}
