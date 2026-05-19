-- ============================================================
-- mygoods DB 스키마 초기화
-- ============================================================

-- PostGIS 확장 (위치 기반 검색)
create extension if not exists postgis;

-- ============================================================
-- 1. users
-- ============================================================
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  pi_uid      text unique not null,
  pi_username text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- 2. items (상품)
-- ============================================================
create table public.items (
  id                   uuid primary key default gen_random_uuid(),
  seller_id            uuid not null references public.users(id) on delete cascade,
  title                text not null,
  description          text,
  price                numeric not null check (price >= 0),
  category             text not null,
  status               text not null default 'selling'
                         check (status in ('selling', 'reserved', 'sold')),
  images               text[] default '{}',
  location             geography(Point, 4326),
  district             text,
  address              text,
  location_verified_at timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- 반경 검색용 공간 인덱스
create index items_location_idx on public.items using gist(location);
-- 상태·카테고리 필터용 인덱스
create index items_status_idx    on public.items(status);
create index items_category_idx  on public.items(category);
create index items_seller_idx    on public.items(seller_id);

-- ============================================================
-- 3. transactions (거래)
-- ============================================================
create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid not null references public.items(id),
  buyer_id       uuid not null references public.users(id),
  seller_id      uuid not null references public.users(id),
  amount         numeric not null check (amount > 0),
  pi_payment_id  text unique,
  pi_txid        text,
  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'completed', 'cancelled')),
  buyer_lat      float,
  buyer_lng      float,
  created_at     timestamptz default now(),
  completed_at   timestamptz
);

create index transactions_buyer_idx  on public.transactions(buyer_id);
create index transactions_seller_idx on public.transactions(seller_id);
create index transactions_item_idx   on public.transactions(item_id);

-- ============================================================
-- 4. chat_rooms (채팅방)
-- ============================================================
create table public.chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  buyer_id   uuid not null references public.users(id),
  seller_id  uuid not null references public.users(id),
  created_at timestamptz default now(),
  unique(item_id, buyer_id)
);

create index chat_rooms_buyer_idx  on public.chat_rooms(buyer_id);
create index chat_rooms_seller_idx on public.chat_rooms(seller_id);

-- ============================================================
-- 5. messages (채팅 메시지)
-- ============================================================
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id  uuid not null references public.users(id),
  content    text not null,
  is_read    boolean not null default false,
  created_at timestamptz default now()
);

create index messages_room_idx on public.messages(room_id);

-- ============================================================
-- 6. updated_at 자동 갱신 트리거
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================
-- 7. Row Level Security (RLS)
-- ============================================================

-- users
alter table public.users enable row level security;

create policy "users: 누구나 읽기"
  on public.users for select using (true);

create policy "users: 본인만 수정"
  on public.users for update
  using (pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid');

-- items
alter table public.items enable row level security;

create policy "items: 누구나 읽기"
  on public.items for select using (true);

create policy "items: 로그인 사용자 등록"
  on public.items for insert
  with check (seller_id in (
    select id from public.users
    where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid'
  ));

create policy "items: 본인만 수정"
  on public.items for update
  using (seller_id in (
    select id from public.users
    where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid'
  ));

create policy "items: 본인만 삭제"
  on public.items for delete
  using (seller_id in (
    select id from public.users
    where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid'
  ));

-- transactions
alter table public.transactions enable row level security;

create policy "transactions: 당사자만 읽기"
  on public.transactions for select
  using (
    buyer_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
    or
    seller_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
  );

-- chat_rooms
alter table public.chat_rooms enable row level security;

create policy "chat_rooms: 당사자만 읽기"
  on public.chat_rooms for select
  using (
    buyer_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
    or
    seller_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
  );

create policy "chat_rooms: 로그인 사용자 생성"
  on public.chat_rooms for insert
  with check (
    buyer_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
  );

-- messages
alter table public.messages enable row level security;

create policy "messages: 채팅방 당사자만 읽기"
  on public.messages for select
  using (
    room_id in (
      select id from public.chat_rooms
      where
        buyer_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
        or
        seller_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
    )
  );

create policy "messages: 채팅방 당사자만 전송"
  on public.messages for insert
  with check (
    room_id in (
      select id from public.chat_rooms
      where
        buyer_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
        or
        seller_id in (select id from public.users where pi_uid = current_setting('request.jwt.claims', true)::json->>'pi_uid')
    )
  );

-- ============================================================
-- 8. Realtime 활성화 (채팅용)
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_rooms;
