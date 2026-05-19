'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import PiLoginButton from '@/components/common/PiLoginButton';
import { MapPin, ShieldCheck, Coins } from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin,
    title: '위치 기반 거래',
    desc: '내 주변 1~10km 이내 상품만 모아서 보여드려요',
  },
  {
    icon: ShieldCheck,
    title: '위치 인증 시스템',
    desc: 'GPS로 실제 위치를 검증해 허위 매물을 방지해요',
  },
  {
    icon: Coins,
    title: 'Pi 코인 결제',
    desc: 'Pi Network의 Pi 코인으로 안전하게 결제해요',
  },
];

export default function SplashPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-b from-orange-50 to-white px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mt-10">
        <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center text-white text-4xl font-extrabold shadow-xl mb-4">
          M
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">mygoods</h1>
        <p className="text-gray-500 mt-2 text-center text-sm leading-relaxed">
          우리 동네 Pi 코인 중고거래
        </p>
      </div>

      {/* Features */}
      <div className="mt-12 space-y-5">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Login */}
      <div className="mt-auto pt-10">
        <PiLoginButton className="w-full" />
        <p className="text-center text-xs text-gray-400 mt-3">
          Pi Browser에서 실행해주세요
        </p>
      </div>
    </div>
  );
}
