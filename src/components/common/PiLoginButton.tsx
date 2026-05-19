'use client';

import { useAuth } from '@/lib/hooks/useAuth';

interface PiLoginButtonProps {
  className?: string;
  label?: string;
}

export default function PiLoginButton({ className = '', label }: PiLoginButtonProps) {
  const { signIn, loading } = useAuth();

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className={`flex items-center justify-center gap-2 bg-[#6832d1] hover:bg-[#5a2bbf] active:scale-95 text-white font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className="text-lg">π</span>
      )}
      <span>
        {loading ? '인증 중...' : label ?? 'Pi로 로그인'}
      </span>
    </button>
  );
}
