'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLocation } from '@/lib/hooks/useLocation';
import TopBar from '@/components/layout/TopBar';
import LocationBadge from '@/components/items/LocationBadge';
import BottomNav from '@/components/layout/BottomNav';
import { MessageCircle, Share2, MoreVertical } from 'lucide-react';
import type { Item } from '@/types';
import { CATEGORIES } from '@/types';

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')} π`;
}

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { coords } = useLocation();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [paying, setPaying] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setItem(data?.item || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const isOwner = user && item && user.id === item.seller_id;
  const isVerified =
    item?.location_verified_at &&
    Date.now() - new Date(item.location_verified_at).getTime() < 24 * 60 * 60 * 1000;

  const categoryLabel = item
    ? CATEGORIES.find((c) => c.key === item.category)?.label || item.category
    : '';

  const handleChat = async () => {
    if (!user) { router.push('/splash'); return; }
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id }),
      });
      if (res.ok) {
        const { room } = await res.json();
        router.push(`/chat/${room.id}`);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user) { router.push('/splash'); return; }
    if (!item) return;
    if (typeof window === 'undefined' || !window.Pi) {
      alert('Pi Browser에서만 결제할 수 있습니다');
      return;
    }

    setPaying(true);
    try {
      window.Pi.createPayment(
        {
          amount: item.price,
          memo: `mygoods: ${item.title}`,
          metadata: { itemId: item.id },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                itemId: item.id,
                buyerLat: coords?.lat,
                buyerLng: coords?.lng,
              }),
            });
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            await fetch('/api/payments/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
            });
            alert('결제가 완료되었습니다!');
            router.push('/my');
          },
          onCancel: () => {
            setPaying(false);
          },
          onError: (error) => {
            console.error('Pi payment error:', error);
            alert('결제 중 오류가 발생했습니다');
            setPaying(false);
          },
        }
      );
    } catch {
      setPaying(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { item: updated } = await res.json();
      setItem(updated);
    }
  };

  const handleDelete = async () => {
    if (!confirm('상품을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/my');
  };

  if (loading) {
    return (
      <div className="min-h-full bg-white pb-20">
        <TopBar showBack />
        <div className="pt-12 animate-pulse">
          <div className="w-full aspect-square bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center text-gray-400">
        <p>상품을 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="mt-4 text-orange-500 text-sm">
          돌아가기
        </button>
      </div>
    );
  }

  const images = item.images || [];

  return (
    <div className="min-h-full bg-white pb-24">
      <TopBar
        showBack
        rightAction={
          isOwner ? (
            <div className="relative group">
              <button className="p-1 text-gray-700">
                <MoreVertical size={20} />
              </button>
              <div className="absolute right-0 top-8 bg-white shadow-lg rounded-xl border border-gray-100 w-36 z-50 hidden group-focus-within:block">
                {item.status === 'selling' && (
                  <button
                    onClick={() => handleStatusChange('reserved')}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    예약중으로 변경
                  </button>
                )}
                {item.status === 'reserved' && (
                  <button
                    onClick={() => handleStatusChange('selling')}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    판매중으로 변경
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => window.Pi?.openShareDialog?.('mygoods', `${item.title} - ${formatPrice(item.price)}`)}
              className="p-1 text-gray-700"
            >
              <Share2 size={20} />
            </button>
          )
        }
      />

      {/* Images */}
      <div className="pt-12">
        {images.length > 0 ? (
          <div>
            <div className="relative w-full aspect-square bg-gray-100">
              <Image
                src={images[imgIdx]}
                alt={item.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              {item.status !== 'selling' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-lg font-bold bg-gray-800/80 px-4 py-2 rounded-xl">
                    {item.status === 'reserved' ? '예약중' : '거래완료'}
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 py-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === imgIdx ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-6xl">
            📦
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Seller info */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold text-sm">
            {(item.seller?.pi_username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {item.seller?.pi_username || '익명'}
            </p>
            <p className="text-xs text-gray-400">{item.district || '위치 미설정'}</p>
          </div>
        </div>

        {/* Item info */}
        <div className="py-4 border-b border-gray-100">
          <div className="flex items-start gap-2">
            <h1 className="text-lg font-bold text-gray-900 flex-1">{item.title}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {categoryLabel}
            </span>
            {isVerified && <LocationBadge />}
            {item.district && <span className="text-xs text-gray-400">{item.district}</span>}
          </div>
          <p className="text-xl font-extrabold text-gray-900 mt-3">{formatPrice(item.price)}</p>
        </div>

        {/* Description */}
        {item.description && (
          <div className="py-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {!isOwner && item.status === 'selling' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={handleChat}
              disabled={chatLoading}
              className="flex items-center justify-center gap-2 flex-1 border border-gray-200 rounded-xl py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <MessageCircle size={18} />
              {chatLoading ? '연결 중...' : '채팅하기'}
            </button>
            <button
              onClick={handleBuy}
              disabled={paying}
              className="flex items-center justify-center gap-2 flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-60 active:scale-[0.98]"
            >
              <span className="text-base">π</span>
              {paying ? '결제 진행 중...' : `${formatPrice(item.price)} 구매`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
