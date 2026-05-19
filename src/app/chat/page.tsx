'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import LoginPrompt from '@/components/common/LoginPrompt';
import type { ChatRoom } from '@/types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간`;
  return `${Math.floor(hours / 24)}일`;
}

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetch('/api/chat/rooms')
      .then((r) => (r.ok ? r.json() : { rooms: [] }))
      .then((data) => { setRooms(data.rooms || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <div className="min-h-full bg-white pb-16">
      <TopBar title="채팅" />

      <div className="pt-12">
        {!user && !authLoading ? (
          <LoginPrompt message="채팅을 이용하려면 Pi 로그인이 필요해요" />
        ) : loading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-4 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-4">💬</span>
            <p className="text-sm">진행 중인 채팅이 없어요</p>
            <p className="text-xs mt-1">상품을 둘러보고 판매자에게 채팅해보세요</p>
            <Link
              href="/home"
              className="mt-6 text-orange-500 text-sm font-semibold border border-orange-400 px-5 py-2 rounded-xl"
            >
              상품 보러가기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rooms.map((room) => {
              const otherUser = user?.id === room.buyer_id
                ? (room as unknown as { seller: { pi_username: string } }).seller
                : (room as unknown as { buyer: { pi_username: string } }).buyer;
              const item = room.item;
              const lastMsg = room.last_message;

              return (
                <Link key={room.id} href={`/chat/${room.id}`} className="block">
                  <div className="flex gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100">
                    {/* Item thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      {item?.images?.[0] ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title || ''}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {otherUser?.pi_username || '상대방'}
                        </p>
                        {lastMsg && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {timeAgo(lastMsg.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {item?.title || '상품 정보 없음'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {lastMsg?.content || '메시지가 없습니다'}
                        </p>
                        {(room.unread_count ?? 0) > 0 && (
                          <span className="flex-shrink-0 ml-2 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
