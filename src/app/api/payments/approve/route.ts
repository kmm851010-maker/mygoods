import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { approvePiPayment, getPiPayment } from '@/lib/pi/payment';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, itemId, buyerLat, buyerLng } = await request.json();

    if (!paymentId || !itemId) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const buyerId = cookieStore.get('mg_user_id')?.value;

    if (!buyerId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 1. Pi API에서 결제 정보 조회
    const piPayment = await getPiPayment(paymentId);

    if (!piPayment) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    if (piPayment.status?.developer_approved) {
      return NextResponse.json({ error: '이미 처리된 결제입니다' }, { status: 400 });
    }

    // 2. 메타데이터의 itemId 검증
    if (piPayment.metadata?.itemId !== itemId) {
      return NextResponse.json({ error: '결제 메타데이터 불일치' }, { status: 400 });
    }

    // 3. 상품 정보 조회
    const supabase = await createServiceClient();
    const { data: item } = await supabase
      .from('items')
      .select('id, seller_id, price, status')
      .eq('id', itemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
    }

    if (item.status !== 'selling') {
      return NextResponse.json({ error: '이미 판매된 상품입니다' }, { status: 400 });
    }

    // 4. Pi가 보낸 금액과 상품 가격 일치 검증
    if (Number(piPayment.amount) !== Number(item.price)) {
      return NextResponse.json({ error: '결제 금액 불일치' }, { status: 400 });
    }

    // 5. Supabase transactions 테이블에 pending 저장
    const { error: txError } = await supabase.from('transactions').insert({
      item_id: itemId,
      buyer_id: buyerId,
      seller_id: item.seller_id,
      amount: piPayment.amount,
      pi_payment_id: paymentId,
      status: 'pending',
      buyer_lat: buyerLat || null,
      buyer_lng: buyerLng || null,
    });

    if (txError) {
      console.error('Transaction insert error:', txError);
    }

    // 6. Pi API approve 호출
    await approvePiPayment(paymentId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Payment approve error:', err);
    return NextResponse.json({ error: '결제 승인 실패' }, { status: 500 });
  }
}
