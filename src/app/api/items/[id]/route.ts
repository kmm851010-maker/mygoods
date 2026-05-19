import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/items/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('items')
      .select('*, seller:users(id, pi_username)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error('GET /api/items/[id] error:', err);
    return NextResponse.json({ error: '상품 조회 실패' }, { status: 500 });
  }
}

// PATCH /api/items/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('mg_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = await createServiceClient();

    // 본인 상품 확인
    const { data: existing } = await supabase
      .from('items')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (!existing || existing.seller_id !== userId) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('items')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: '수정 실패' }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error('PATCH /api/items/[id] error:', err);
    return NextResponse.json({ error: '수정 중 오류 발생' }, { status: 500 });
  }
}

// DELETE /api/items/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('mg_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const { data: existing } = await supabase
      .from('items')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (!existing || existing.seller_id !== userId) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) return NextResponse.json({ error: '삭제 실패' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/items/[id] error:', err);
    return NextResponse.json({ error: '삭제 중 오류 발생' }, { status: 500 });
  }
}
