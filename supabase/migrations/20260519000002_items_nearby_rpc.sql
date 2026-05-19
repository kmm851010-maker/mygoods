-- ============================================================
-- items_nearby RPC: 반경 내 상품 조회 (PostGIS)
-- ============================================================
create or replace function public.items_nearby(
  p_lat     float,
  p_lng     float,
  p_radius  int,           -- 미터 단위
  p_category text default null,
  p_limit   int  default 20,
  p_offset  int  default 0
)
returns table (
  id                   uuid,
  seller_id            uuid,
  title                text,
  description          text,
  price                numeric,
  category             text,
  status               text,
  images               text[],
  district             text,
  address              text,
  location_verified_at timestamptz,
  created_at           timestamptz,
  updated_at           timestamptz,
  distance_m           float
)
language sql stable
as $$
  select
    i.id,
    i.seller_id,
    i.title,
    i.description,
    i.price,
    i.category,
    i.status,
    i.images,
    i.district,
    i.address,
    i.location_verified_at,
    i.created_at,
    i.updated_at,
    ST_Distance(i.location, ST_MakePoint(p_lng, p_lat)::geography) as distance_m
  from public.items i
  where
    i.status = 'selling'
    and i.location is not null
    and ST_DWithin(
      i.location,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius
    )
    and (p_category is null or i.category = p_category)
  order by distance_m asc
  limit p_limit
  offset p_offset;
$$;
