import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/items?lat=&lng=&radius=&category=&page=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '5000');
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const supabase = await createServiceClient();

    if (lat && lng && radius > 0) {
      // PostGIS 반경 검색
      const { data, error } = await supabase.rpc('items_nearby', {
        p_lat: lat,
        p_lng: lng,
        p_radius: radius,
        p_category: category === 'all' ? null : category,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('items_nearby rpc error:', error);
        // Fallback: 전체 조회
        return await getAllItems(supabase, category, limit, offset);
      }

      return NextResponse.json({ items: data || [] });
    }

    return await getAllItems(supabase, category, limit, offset);
  } catch (err) {
    console.error('GET /api/items error:', err);
    return NextResponse.json({ error: '상품 조회 실패' }, { status: 500 });
  }
}

async function getAllItems(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  category: string,
  limit: number,
  offset: number
) {
  let query = supabase
    .from('items')
    .select('*, seller:users(id, pi_username)')
    .eq('status', 'selling')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: '상품 조회 실패' }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

// POST /api/items
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('mg_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, category, images, lat, lng, district, address } = body;

    if (!title || price === undefined || !category) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const itemData: Record<string, unknown> = {
      seller_id: userId,
      title,
      description,
      price: parseFloat(price),
      category,
      images: images || [],
      district,
      address,
    };

    if (lat && lng) {
      // PostGIS point: ST_MakePoint(lng, lat)
      itemData.location = `SRID=4326;POINT(${lng} ${lat})`;
      itemData.location_verified_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from('items').insert(itemData).select().single();

    if (error) {
      console.error('Insert item error:', error);
      return NextResponse.json({ error: '상품 등록 실패' }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/items error:', err);
    return NextResponse.json({ error: '상품 등록 중 오류 발생' }, { status: 500 });
  }
}
