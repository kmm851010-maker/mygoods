import { NextRequest, NextResponse } from 'next/server';
import { verifyPiAccessToken } from '@/lib/pi/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, piUser } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'accessToken이 필요합니다' }, { status: 400 });
    }

    // 1. Pi API로 accessToken 검증
    const piMe = await verifyPiAccessToken(accessToken);

    if (!piMe?.uid) {
      return NextResponse.json({ error: '유효하지 않은 Pi 토큰입니다' }, { status: 401 });
    }

    // 2. Supabase에 유저 upsert
    const supabase = await createServiceClient();
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          pi_uid: piMe.uid,
          pi_username: piMe.username || piUser?.username,
        },
        { onConflict: 'pi_uid' }
      )
      .select()
      .single();

    if (error || !user) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: '사용자 저장 실패' }, { status: 500 });
    }

    // 3. 세션 쿠키 설정 (httpOnly)
    const cookieStore = await cookies();
    cookieStore.set('mg_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Pi auth error:', err);
    return NextResponse.json({ error: '인증 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}
