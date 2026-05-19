import { NextRequest, NextResponse } from 'next/server';
import { approvePiPayment } from '@/lib/pi/payment';

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    await approvePiPayment(paymentId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Test payment approve error:', err);
    return NextResponse.json({ error: '결제 승인 실패' }, { status: 500 });
  }
}
