import { NextRequest, NextResponse } from 'next/server';
import { completePiPayment } from '@/lib/pi/payment';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    await completePiPayment(paymentId, txid);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Test payment complete error:', err);
    return NextResponse.json({ error: '결제 완료 처리 실패' }, { status: 500 });
  }
}
