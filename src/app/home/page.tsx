'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, RefreshCw, ChevronDown } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';
import ItemList from '@/components/items/ItemList';
import CategoryFilter from '@/components/items/CategoryFilter';
import DistanceFilter from '@/components/common/DistanceFilter';
import LocationPermissionModal from '@/components/common/LocationPermissionModal';
import { useStoredLocation } from '@/lib/hooks/useStoredLocation';
import type { Item } from '@/types';

const LOCATION_ASKED_KEY = 'mg_location_asked';

export default function HomePage() {
  const router = useRouter();
  const { location, ready } = useStoredLocation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [radius, setRadius] = useState(5000);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 첫 방문 시 위치 권한 모달 표시
  useEffect(() => {
    if (!ready) return;
    if (!location && !localStorage.getItem(LOCATION_ASKED_KEY)) {
      setShowLocationModal(true);
    }
  }, [ready, location]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category, page: '1' });
      if (location && radius > 0) {
        params.set('lat', location.lat.toString());
        params.set('lng', location.lng.toString());
        params.set('radius', radius.toString());
      }
      if (search) params.set('search', search);

      const res = await fetch(`/api/items?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
    } finally {
      setLoading(false);
    }
  }, [location, category, radius, search]);

  useEffect(() => {
    if (ready) fetchItems();
  }, [fetchItems, ready]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleAllowLocation = () => {
    setShowLocationModal(false);
    localStorage.setItem(LOCATION_ASKED_KEY, '1');
    router.push('/location');
  };

  const handleDenyLocation = () => {
    setShowLocationModal(false);
    localStorage.setItem(LOCATION_ASKED_KEY, '1');
  };

  return (
    <div className="min-h-full bg-white pb-16">
      {/* 위치 권한 모달 */}
      {showLocationModal && (
        <LocationPermissionModal
          onAllow={handleAllowLocation}
          onDeny={handleDenyLocation}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Location button → /location 페이지로 이동 */}
          <button
            onClick={() => router.push('/location')}
            className="flex items-center gap-1 text-gray-900 font-bold text-base min-w-0"
          >
            <MapPin size={16} className="text-orange-500 flex-shrink-0" />
            <span className="truncate max-w-[140px]">
              {location ? location.district : '동네 설정'}
            </span>
            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          </button>

          <div className="flex-1" />

          <button
            onClick={fetchItems}
            disabled={loading}
            className="p-1.5 text-gray-500 hover:text-orange-500"
            aria-label="새로고침"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="어떤 물건을 찾고 계세요?"
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </form>

        {/* Distance Filter */}
        <div className="px-4 pb-2">
          <DistanceFilter selected={radius} onChange={setRadius} />
        </div>
      </header>

      {/* Category Filter */}
      <div className="pt-3 pb-1 border-b border-gray-100">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* 위치 미설정 배너 */}
      {ready && !location && (
        <button
          onClick={() => router.push('/location')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100 text-left"
        >
          <MapPin size={16} className="text-orange-400 flex-shrink-0" />
          <span className="text-sm text-orange-700 flex-1">
            동네를 설정하면 내 주변 상품을 볼 수 있어요
          </span>
          <span className="text-xs font-semibold text-orange-500">설정하기 →</span>
        </button>
      )}

      {/* Item List */}
      <ItemList items={items} loading={loading} />
    </div>
  );
}
