'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export default function TopBar({ title, showBack = false, rightAction, transparent = false }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-4 ${
        transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="max-w-lg mx-auto w-full flex items-center justify-between">
        <div className="w-8">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 text-gray-700"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={22} />
            </button>
          )}
        </div>

        {title && (
          <h1 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
            {title}
          </h1>
        )}

        <div className="w-8 flex justify-end">{rightAction}</div>
      </div>
    </header>
  );
}
