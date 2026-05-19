'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, PlusCircle, User, MapPin } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', icon: Home, label: '홈' },
  { href: '/location', icon: MapPin, label: '동네설정' },
  { href: '/write', icon: PlusCircle, label: '글쓰기', primary: true },
  { href: '/chat', icon: MessageCircle, label: '채팅' },
  { href: '/my', icon: User, label: '나의거래' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, primary }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
                primary
                  ? 'text-orange-500'
                  : active
                  ? 'text-orange-500'
                  : 'text-gray-400'
              }`}
            >
              <Icon
                size={primary ? 28 : 22}
                strokeWidth={primary ? 2.5 : active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium ${primary ? 'text-orange-500' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
