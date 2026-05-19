'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { LogIn } from 'lucide-react';

interface LoginPromptProps {
  message?: string;
}

export default function LoginPrompt({ message = 'Pi 로그인이 필요한 기능이에요' }: LoginPromptProps) {
  const { signIn, loading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
        <LogIn size={28} className="text-orange-400" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{message}</p>
      <p className="text-xs text-gray-400 mt-1">Pi Browser에서 로그인해주세요</p>
      <button
        onClick={signIn}
        disabled={loading}
        className="mt-6 flex items-center gap-2 bg-[#6832d1] hover:bg-[#5a2bbf] text-white font-semibold px-6 py-3 rounded-xl text-sm disabled:opacity-60 active:scale-[0.98] transition-all"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>π</span>
        )}
        Pi로 로그인
      </button>
    </div>
  );
}
