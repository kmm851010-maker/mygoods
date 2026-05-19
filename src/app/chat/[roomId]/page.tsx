'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import TopBar from '@/components/layout/TopBar';
import ChatRoom from '@/components/chat/ChatRoom';
import { createClient } from '@/lib/supabase/client';

interface RoomData {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  item?: { id: string; title: string; price: number; images?: string[]; status: string };
  buyer?: { id: string; pi_username?: string };
  seller?: { id: string; pi_username?: string };
}

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/splash'); return; }

    const supabase = createClient();
    supabase
      .from('chat_rooms')
      .select(`
        *,
        item:items(id, title, price, images, status),
        buyer:users!chat_rooms_buyer_id_fkey(id, pi_username),
        seller:users!chat_rooms_seller_id_fkey(id, pi_username)
      `)
      .eq('id', roomId)
      .single()
      .then(({ data, error }) => {
        if (!error) setRoom(data);
        setLoading(false);
      });
  }, [roomId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room || !user) return null;

  const otherUser = user.id === room.buyer_id ? room.seller : room.buyer;

  return (
    <div className="h-full flex flex-col bg-white">
      <TopBar
        showBack
        title={otherUser?.pi_username || '채팅'}
      />

      {/* Item info strip */}
      {room.item && (
        <div className="pt-12 border-b border-gray-100">
          <Link href={`/items/${room.item.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
              {room.item.images?.[0] ? (
                <Image
                  src={room.item.images[0]}
                  alt={room.item.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{room.item.title}</p>
              <p className="text-xs text-gray-500">
                {room.item.price.toLocaleString('ko-KR')} π
                {room.item.status !== 'selling' && (
                  <span className="ml-2 text-gray-400">
                    ({room.item.status === 'reserved' ? '예약중' : '거래완료'})
                  </span>
                )}
              </p>
            </div>
            <span className="text-xs text-gray-400">›</span>
          </Link>
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatRoom roomId={roomId} userId={user.id} />
      </div>
    </div>
  );
}
