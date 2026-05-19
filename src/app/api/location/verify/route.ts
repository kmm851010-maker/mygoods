import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { reverseGeocode } from '@/lib/location/geocode';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('mg_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { lat, lng, inputAddress } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'GPS 좌표가 필요합니다' }, { status: 400 });
    }

    // 서버에서 좌표 → 주소 변환 (클라이언트 조작 방지)
    const { district, address } = await reverseGeocode(lat, lng);

    // 입력 주소와 서버 검증 주소 비교 (느슨한 검증)
    let verified = true;
    if (inputAddress) {
      const serverDistrict = district.toLowerCase();
      const clientAddress = inputAddress.toLowerCase();
      verified = clientAddress.includes(serverDistrict) || serverDistrict.includes(clientAddress.split(' ')[0]);
    }

    return NextResponse.json({
      verified,
      district,
      address,
      lat,
      lng,
      verified_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Location verify error:', err);
    return NextResponse.json({ error: '위치 검증 실패' }, { status: 500 });
  }
}
