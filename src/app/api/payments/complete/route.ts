import { NextRequest, NextResponse } from 'next/server';
import { completePiPayment } from '@/lib/pi/payment';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // 1. Pi API complete 호출
    await completePiPayment(paymentId, txid);

    // 2. transaction 상태 completed로 업데이트
    const { data: tx } = await supabase
      .from('transactions')
      .update({ status: 'completed', pi_txid: txid, completed_at: new Date().toISOString() })
      .eq('pi_payment_id', paymentId)
      .select('item_id, buyer_id, seller_id')
      .single();

    if (tx) {
      // 3. 상품 상태 sold로 업데이트
      await supabase.from('items').update({ status: 'sold' }).eq('id', tx.item_id);

      // 4. 채팅방 확인 / 생성 후 거래완료 메시지 전송
      let { data: room } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('item_id', tx.item_id)
        .eq('buyer_id', tx.buyer_id)
        .single();

      if (!room) {
        const { data: newRoom } = await supabase
          .from('chat_rooms')
          .insert({ item_id: tx.item_id, buyer_id: tx.buyer_id, seller_id: tx.seller_id })
          .select('id')
          .single();
        room = newRoom;
      }

      if (room) {
        await supabase.from('messages').insert({
          room_id: room.id,
          sender_id: tx.seller_id,
          content: '거래가 완료되었습니다. 감사합니다!',
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Payment complete error:', err);
    return NextResponse.json({ error: '결제 완료 처리 실패' }, { status: 500 });
  }
}
