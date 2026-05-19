import ItemCard from './ItemCard';
import type { Item } from '@/types';

interface ItemListProps {
  items: Item[];
  loading?: boolean;
}

export default function ItemList({ items, loading }: ItemListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-4 px-4 animate-pulse">
            <div className="w-24 h-24 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 py-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">📭</span>
        <p className="text-sm">주변에 등록된 상품이 없어요</p>
        <p className="text-xs mt-1">범위를 넓히거나 전체 보기를 선택해보세요</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
