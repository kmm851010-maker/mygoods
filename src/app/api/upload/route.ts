import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('mg_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: '최대 5장까지 업로드 가능합니다' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `지원하지 않는 파일 형식: ${file.type}` }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다' }, { status: 400 });
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('item-images')
        .upload(path, file, { contentType: file.type });

      if (error) {
        console.error('Storage upload error:', error);
        return NextResponse.json({ error: '이미지 업로드 실패' }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from('item-images').getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: '업로드 중 오류 발생' }, { status: 500 });
  }
}
