'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLocation } from '@/lib/hooks/useLocation';
import TopBar from '@/components/layout/TopBar';
import ImageUploader from '@/components/common/ImageUploader';
import { CATEGORIES } from '@/types';
import { MapPin, CheckCircle } from 'lucide-react';

const ITEM_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'all');

export default function WritePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { coords, district, loading: locLoading, getLocation, error: locError } = useLocation();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/splash');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !category) {
      alert('제목, 가격, 카테고리를 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category,
          images,
          lat: coords?.lat,
          lng: coords?.lng,
          district,
        }),
      });

      if (res.ok) {
        const { item } = await res.json();
        router.push(`/items/${item.id}`);
      } else {
        const err = await res.json();
        alert(err.error || '상품 등록에 실패했습니다');
      }
    } catch {
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-white">
      <TopBar title="상품 등록" showBack />

      <form onSubmit={handleSubmit} className="pt-12 pb-24 px-4 space-y-5">
        {/* Image Upload */}
        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사진 <span className="text-gray-400 font-normal">(최대 5장)</span>
          </label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            제목 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="상품 제목을 입력해주세요"
            maxLength={50}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            카테고리 <span className="text-red-400">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 bg-white"
          >
            <option value="">카테고리 선택</option>
            {ITEM_CATEGORIES.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            가격 (π) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              π
            </span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.001"
              required
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상품 상태, 구입 시기, 사용감 등을 자세히 적어주세요"
            rows={5}
            maxLength={2000}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{description.length}/2000</p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">거래 위치</label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {coords ? (
              <div className="flex items-center gap-2 flex-1">
                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{district || '위치 확인됨'}</p>
                  <p className="text-xs text-gray-500">위치 인증 완료</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <MapPin size={18} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-500">{locError || '위치를 확인해주세요'}</p>
              </div>
            )}
            <button
              type="button"
              onClick={getLocation}
              disabled={locLoading}
              className="text-orange-500 text-sm font-medium disabled:opacity-50"
            >
              {locLoading ? '확인 중...' : coords ? '재인증' : '인증'}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-60"
            >
              {submitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
