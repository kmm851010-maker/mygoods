'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import LoginPrompt from '@/components/common/LoginPrompt';
import { LogOut, Package, ShoppingBag } from 'lucide-react';
import type { Item, Transaction } from '@/types';
import { createClient } from '@/lib/supabase/client';

type Tab = 'selling' | 'buying';

export default function MyPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('selling');
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const supabase = createClient();
    Promise.all([
      supabase
        .from('items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, item:items(id, title, price, images)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([itemsRes, txRes]) => {
      setMyItems(itemsRes.data || []);
      setTransactions(txRes.data || []);
      setLoading(false);
    });
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
  };

  const statusLabel: Record<string, string> = {
    selling: '판매중',
    reserved: '예약중',
    sold: '거래완료',
  };

  const statusColor: Record<string, string> = {
    selling: 'text-emerald-500',
    reserved: 'text-orange-400',
    sold: 'text-gray-400',
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-full bg-white pb-16">
        <TopBar title="나의 거래" />
        <div className="pt-12">
          <LoginPrompt message="판매/구매 내역은 Pi 로그인 후 확인할 수 있어요" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 pb-16">
      <TopBar
        title="나의 거래"
        rightAction={
          <button onClick={handleSignOut} className="p-1 text-gray-500">
            <LogOut size={18} />
          </button>
        }
      />

      <div className="pt-12">
        {/* Profile */}
        <div className="bg-white px-6 py-6 flex items-center gap-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-2xl font-bold">
            {(user?.pi_username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">
              {user?.pi_username || '익명 사용자'}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">Pi Network 계정</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-100">
          <button
            onClick={() => setTab('selling')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'selling'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-500'
            }`}
          >
            <Package size={16} />
            판매 내역
          </button>
          <button
            onClick={() => setTab('buying')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'buying'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-500'
            }`}
          >
            <ShoppingBag size={16} />
            구매 내역
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white divide-y divide-gray-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-4 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'selling' ? (
          <div className="bg-white">
            {myItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Package size={40} className="mb-3 text-gray-300" />
                <p className="text-sm">등록한 상품이 없어요</p>
                <Link
                  href="/write"
                  className="mt-4 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
                >
                  상품 등록하기
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myItems.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`} className="block">
                    <div className="flex gap-3 px-4 py-4 hover:bg-gray-50">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 relative flex-shrink-0">
                        {item.images?.[0] ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {item.price.toLocaleString('ko-KR')} π
                        </p>
                        <span className={`text-xs font-medium ${statusColor[item.status] || 'text-gray-400'}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ShoppingBag size={40} className="mb-3 text-gray-300" />
                <p className="text-sm">구매 내역이 없어요</p>
                <Link
                  href="/home"
                  className="mt-4 border border-orange-400 text-orange-500 text-sm font-semibold px-5 py-2.5 rounded-xl"
                >
                  상품 보러가기
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <Link key={tx.id} href={`/items/${tx.item_id}`} className="block">
                    <div className="flex gap-3 px-4 py-4 hover:bg-gray-50">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 relative flex-shrink-0">
                        {tx.item?.images?.[0] ? (
                          <Image
                            src={tx.item.images[0]}
                            alt={tx.item.title || ''}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tx.item?.title || '삭제된 상품'}
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {tx.amount.toLocaleString('ko-KR')} π
                        </p>
                        <span
                          className={`text-xs font-medium ${
                            tx.status === 'completed' ? 'text-emerald-500' : 'text-orange-400'
                          }`}
                        >
                          {tx.status === 'completed' ? '거래완료' : '진행중'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
