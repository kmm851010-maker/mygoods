import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/chat/rooms - 내 채팅방 목록
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('mg_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        item:items(id, title, price, images, status),
        buyer:users!chat_rooms_buyer_id_fkey(id, pi_username),
        seller:users!chat_rooms_seller_id_fkey(id, pi_username)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Chat rooms error:', error);
      return NextResponse.json({ error: '채팅방 조회 실패' }, { status: 500 });
    }

    // 각 방의 마지막 메시지 & 미읽은 수 조회
    const roomsWithMeta = await Promise.all(
      (rooms || []).map(async (room) => {
        const [lastMsg, unreadCount] = await Promise.all([
          supabase
            .from('messages')
            .select('content, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
            .then(({ data }) => data),
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', userId)
            .eq('is_read', false)
            .then(({ count }) => count || 0),
        ]);

        return { ...room, last_message: lastMsg, unread_count: unreadCount };
      })
    );

    return NextResponse.json({ rooms: roomsWithMeta });
  } catch (err) {
    console.error('GET /api/chat/rooms error:', err);
    return NextResponse.json({ error: '채팅방 조회 실패' }, { status: 500 });
  }
}

// POST /api/chat/rooms - 채팅방 생성 or 조회
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const buyerId = cookieStore.get('mg_user_id')?.value;

    if (!buyerId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { itemId } = await request.json();
    if (!itemId) {
      return NextResponse.json({ error: 'itemId가 필요합니다' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // 상품 정보 조회
    const { data: item } = await supabase
      .from('items')
      .select('id, seller_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
    }

    if (item.seller_id === buyerId) {
      return NextResponse.json({ error: '본인 상품에는 채팅할 수 없습니다' }, { status: 400 });
    }

    // 기존 채팅방 조회 or 생성
    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('item_id', itemId)
      .eq('buyer_id', buyerId)
      .single();

    if (existing) {
      return NextResponse.json({ room: existing });
    }

    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({ item_id: itemId, buyer_id: buyerId, seller_id: item.seller_id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '채팅방 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    console.error('POST /api/chat/rooms error:', err);
    return NextResponse.json({ error: '채팅방 생성 실패' }, { status: 500 });
  }
}
