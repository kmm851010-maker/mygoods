import Link from 'next/link';
import Image from 'next/image';
import { formatDistance } from '@/lib/location/distance';
import LocationBadge from './LocationBadge';
import type { Item } from '@/types';

interface ItemCardProps {
  item: Item;
}

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')} π`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function ItemCard({ item }: ItemCardProps) {
  const thumbnail = item.images?.[0];
  const isVerified =
    item.location_verified_at &&
    Date.now() - new Date(item.location_verified_at).getTime() < 24 * 60 * 60 * 1000;

  return (
    <Link href={`/items/${item.id}`} className="block">
      <div className="flex gap-3 py-4 px-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
        {/* Thumbnail */}
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={item.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
              📦
            </div>
          )}
          {item.status === 'reserved' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-gray-700 px-2 py-0.5 rounded">예약중</span>
            </div>
          )}
          {item.status === 'sold' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-gray-700 px-2 py-0.5 rounded">거래완료</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
          <div>
            <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">{item.district || '위치 미설정'}</span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{timeAgo(item.created_at)}</span>
              {item.distance_m !== undefined && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-orange-400">
                    {formatDistance(item.distance_m)}
                  </span>
                </>
              )}
            </div>
            {isVerified && (
              <div className="mt-1">
                <LocationBadge />
              </div>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(item.price)}</p>
        </div>
      </div>
    </Link>
  );
}
