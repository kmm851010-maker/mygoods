import { NextRequest, NextResponse } from 'next/server';
import { getPiPayment, completePiPayment } from '@/lib/pi/payment';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    const piPayment = await getPiPayment(paymentId);

    if (!piPayment) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    // developer_approved 됐지만 completed 안 된 경우 complete 재시도
    if (piPayment.status?.developer_approved && !piPayment.status?.developer_completed) {
      const completeTxid = txid || piPayment.transaction?.txid;
      if (completeTxid) {
        await completePiPayment(paymentId, completeTxid);

        const supabase = await createServiceClient();
        await supabase
          .from('transactions')
          .update({ status: 'completed', pi_txid: completeTxid, completed_at: new Date().toISOString() })
          .eq('pi_payment_id', paymentId);

        const { data: tx } = await supabase
          .from('transactions')
          .select('item_id')
          .eq('pi_payment_id', paymentId)
          .single();

        if (tx?.item_id) {
          await supabase.from('items').update({ status: 'sold' }).eq('id', tx.item_id);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Incomplete payment handler error:', err);
    return NextResponse.json({ error: '미완료 결제 처리 실패' }, { status: 500 });
  }
}
