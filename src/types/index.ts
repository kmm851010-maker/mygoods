export type User = {
  id: string;
  pi_uid: string;
  pi_username?: string;
  created_at: string;
};

export type ItemStatus = 'selling' | 'reserved' | 'sold';

export type Item = {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  status: ItemStatus;
  images?: string[];
  location?: unknown;
  district?: string;
  address?: string;
  location_verified_at?: string;
  created_at: string;
  updated_at: string;
  distance_m?: number;
  seller?: User;
};

export type TransactionStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export type Transaction = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  pi_payment_id?: string;
  pi_txid?: string;
  status: TransactionStatus;
  buyer_lat?: number;
  buyer_lng?: number;
  created_at: string;
  completed_at?: string;
  item?: Item;
};

export type ChatRoom = {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  item?: Item;
  other_user?: User;
  last_message?: Message;
  unread_count?: number;
};

export type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type Category = {
  key: string;
  label: string;
};

export const CATEGORIES: Category[] = [
  { key: 'all', label: '전체' },
  { key: 'digital', label: '디지털/가전' },
  { key: 'furniture', label: '가구/인테리어' },
  { key: 'kitchen', label: '생활/주방' },
  { key: 'women_clothes', label: '여성의류' },
  { key: 'men_clothes', label: '남성의류' },
  { key: 'kids', label: '유아동' },
  { key: 'sports', label: '스포츠/레저' },
  { key: 'books', label: '도서/티켓/음반' },
  { key: 'beauty', label: '뷰티/미용' },
  { key: 'pets', label: '반려동물' },
  { key: 'etc', label: '기타' },
];

export const DISTANCE_OPTIONS = [
  { value: 1000, label: '1km' },
  { value: 3000, label: '3km' },
  { value: 5000, label: '5km' },
  { value: 10000, label: '10km' },
  { value: 0, label: '전체' },
];
