# mygoods - 우리 동네 중고거래 플랫폼

## 개요
mygoods는 Pi Browser에서 동작하는 위치 기반 중고거래 웹앱입니다.
한국의 당근마켓을 모티브로 한 UI/UX를 제공하며, Pi Network의 Pi 코인을 결제 수단으로 사용합니다.
GPS 기반 위치 인증 시스템으로 허위 위치 등록을 방지하여 신뢰 있는 거래를 지원합니다.
**Next.js + Supabase + Vercel** 풀스택 조합으로 구축합니다.

---

## 기술 스택

| 영역 | 기술 | 용도 |
|------|------|------|
| Frontend | Next.js 14 (App Router) | UI 렌더링, 라우팅, API Routes |
| Backend | Next.js API Routes (서버 컴포넌트 포함) | Pi 결제 승인/완료, 서버 로직 |
| Database | Supabase (PostgreSQL) | 유저, 상품, 채팅, 거래 데이터 저장 |
| Auth | Supabase Auth + Pi Network SDK v2.0 | Pi UID 기반 커스텀 인증 |
| Storage | Supabase Storage | 상품 이미지 업로드/CDN |
| Realtime | Supabase Realtime | 1:1 채팅 실시간 메시지 |
| 스타일 | Tailwind CSS | 모바일 퍼스트 반응형 UI |
| 배포 | Vercel | 자동 CI/CD, Edge Network |
| 위치 | Browser Geolocation API + Nominatim | GPS 좌표 획득 및 역지오코딩 |
| 아이콘 | Lucide React | UI 아이콘 |

---

## 핵심 기능

### 1. Pi ID 로그인
- Pi Network SDK `Pi.authenticate()`로 Pi UID + accessToken 획득
- accessToken을 서버에서 Pi API(`/v2/me`)로 검증 후 Supabase users 테이블에 upsert
- Supabase Auth의 커스텀 JWT 또는 서버 세션으로 로그인 상태 유지
- 별도 회원가입 불필요 — Pi 계정 하나로 즉시 이용

### 2. 위치 기반 상품 피드
- Browser Geolocation API로 현재 GPS 좌표 획득
- Nominatim 역지오코딩으로 행정구역명(시/구/동) 추출
- Supabase PostGIS `ST_DWithin` 쿼리로 반경 내 상품 조회
  - 필터 옵션: 1km / 3km / 5km / 10km / 전체
  - 또는 지역명(시/구/동) 텍스트 검색
- 내 위치 기준 판매자까지의 거리 계산 후 목록에 표시

### 3. 위치 인증 시스템 (사기 방지)
- 상품 등록 시 실시간 GPS 좌표 + 타임스탬프를 서버에서 저장
- 서버 측에서 GPS 좌표와 입력 주소의 일치 여부 2차 검증
- 인증 유효기간: 24시간 (이후 재인증 필요)
- 인증된 상품에만 "위치인증" 배지 표시
- 구매 시 구매자 위치도 함께 검증 (동일 지역 우선 거래 유도)

### 4. Pi 결제
- `Pi.createPayment()`으로 Pi 코인 결제 시작
- `onReadyForServerApproval` → Next.js API Route `/api/payments/approve`에서 Pi 서버 검증
- `onReadyForServerCompletion` → `/api/payments/complete`에서 거래 완료 처리
- 결제 완료 시 Supabase transactions 테이블 업데이트, 채팅방 알림 전송

### 5. 1:1 채팅
- Supabase Realtime으로 판매자/구매자 실시간 채팅
- 메시지 읽음 여부, 안 읽은 메시지 수 배지 표시
- 채팅방은 상품 단위로 생성 (상품 1개당 구매자별 1채팅방)

### 6. 상품 이미지 업로드
- Supabase Storage에 이미지 업로드 (최대 5장)
- 업로드된 이미지는 CDN URL로 제공
- 클라이언트에서 미리보기 후 등록

---

## 프로젝트 파일 구조

```
mygoods/
├── CLAUDE.md
├── .env.local                     # 환경변수 (Supabase URL/Key, Pi API Key 등)
├── next.config.js
├── tailwind.config.js
├── package.json
│
├── public/
│   └── pi-sdk.js                  # Pi Network SDK (Pi Browser에서 주입됨)
│
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # 루트 레이아웃 (Pi SDK 초기화, 전역 상태)
│   ├── page.tsx                   # 진입점 → 로그인 여부에 따라 /home 또는 /splash로 리다이렉트
│   │
│   ├── splash/
│   │   └── page.tsx               # Pi ID 로그인 화면
│   │
│   ├── home/
│   │   └── page.tsx               # 내 주변 중고상품 피드 (검색, 카테고리 필터)
│   │
│   ├── write/
│   │   └── page.tsx               # 새 상품 등록 (이미지, 제목, 가격, 설명, 카테고리)
│   │
│   ├── items/
│   │   └── [id]/
│   │       └── page.tsx           # 상품 상세 (판매자 정보, 위치인증 배지, Pi 구매 버튼)
│   │
│   ├── chat/
│   │   ├── page.tsx               # 채팅 목록
│   │   └── [roomId]/
│   │       └── page.tsx           # 1:1 채팅방 (Supabase Realtime)
│   │
│   ├── my/
│   │   └── page.tsx               # 내 프로필 / 등록한 상품 / 거래내역
│   │
│   └── location-verify/
│       └── page.tsx               # 위치 인증 화면
│
├── app/api/                       # Next.js API Routes (서버 전용)
│   ├── auth/
│   │   └── pi/route.ts            # Pi accessToken 검증 → Supabase 세션 발급
│   ├── payments/
│   │   ├── approve/route.ts       # Pi 결제 서버 승인
│   │   └── complete/route.ts      # Pi 결제 완료 처리
│   ├── items/
│   │   ├── route.ts               # 상품 목록 조회 (PostGIS 반경 쿼리)
│   │   └── [id]/route.ts          # 상품 상세 / 수정 / 삭제
│   └── location/
│       └── verify/route.ts        # 서버 측 위치 좌표 검증
│
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx          # 하단 네비게이션 바
│   │   └── TopBar.tsx             # 상단 헤더 (뒤로가기, 제목, 액션버튼)
│   ├── items/
│   │   ├── ItemCard.tsx           # 상품 카드 (목록용)
│   │   ├── ItemList.tsx           # 상품 목록
│   │   ├── CategoryFilter.tsx     # 카테고리 필터 탭
│   │   └── LocationBadge.tsx      # 위치인증 배지
│   ├── chat/
│   │   ├── ChatRoom.tsx           # 채팅방 컴포넌트
│   │   └── MessageBubble.tsx      # 채팅 말풍선
│   └── common/
│       ├── PiLoginButton.tsx      # Pi 로그인 버튼
│       ├── ImageUploader.tsx      # 이미지 업로드 UI
│       └── DistanceFilter.tsx     # 반경 필터 선택
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase 클라이언트 (브라우저용)
│   │   └── server.ts              # Supabase 클라이언트 (서버/API Route용)
│   ├── pi/
│   │   ├── auth.ts                # Pi accessToken 검증 헬퍼
│   │   └── payment.ts             # Pi 결제 서버 API 헬퍼
│   ├── location/
│   │   ├── gps.ts                 # GPS 좌표 획득 훅/유틸
│   │   ├── geocode.ts             # Nominatim 역지오코딩
│   │   └── distance.ts            # Haversine 거리 계산
│   └── hooks/
│       ├── useAuth.ts             # Pi 인증 상태 전역 훅
│       ├── useLocation.ts         # 위치 상태 훅
│       └── useChat.ts             # Supabase Realtime 채팅 훅
│
└── supabase/
    └── migrations/                # DB 스키마 마이그레이션 SQL 파일
```

---

## Supabase 데이터베이스 스키마

### users
```sql
create table users (
  id          uuid primary key default gen_random_uuid(),
  pi_uid      text unique not null,       -- Pi Network UID
  pi_username text,                        -- Pi 유저명 (변경 가능, 표시용)
  created_at  timestamptz default now()
);
```

### items (상품)
```sql
create extension if not exists postgis;

create table items (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid references users(id) on delete cascade,
  title           text not null,
  description     text,
  price           numeric not null,               -- Pi 단위
  category        text not null,
  status          text default 'selling',         -- selling | reserved | sold
  images          text[],                          -- Supabase Storage URL 배열
  location        geography(Point, 4326),          -- PostGIS 좌표
  district        text,                            -- 동/읍/면 이름
  address         text,                            -- 전체 주소 (표시용)
  location_verified_at timestamptz,               -- 위치 인증 시각
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 반경 검색을 위한 공간 인덱스
create index items_location_idx on items using gist(location);
```

### transactions (거래)
```sql
create table transactions (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid references items(id),
  buyer_id        uuid references users(id),
  seller_id       uuid references users(id),
  amount          numeric not null,               -- Pi 단위
  pi_payment_id   text unique,                    -- Pi 결제 ID
  pi_txid         text,                           -- Pi 블록체인 TX ID
  status          text default 'pending',         -- pending | approved | completed | cancelled
  buyer_lat       float,                          -- 구매자 위치 검증용
  buyer_lng       float,
  created_at      timestamptz default now(),
  completed_at    timestamptz
);
```

### chat_rooms (채팅방)
```sql
create table chat_rooms (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references items(id),
  buyer_id    uuid references users(id),
  seller_id   uuid references users(id),
  created_at  timestamptz default now(),
  unique(item_id, buyer_id)
);
```

### messages (채팅 메시지)
```sql
create table messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references chat_rooms(id) on delete cascade,
  sender_id   uuid references users(id),
  content     text not null,
  is_read     boolean default false,
  created_at  timestamptz default now()
);
```

---

## 화면 구성 (App Router 라우팅)

| 경로 | 화면 | 설명 |
|------|------|------|
| `/splash` | 로그인 | Pi ID 로그인 버튼, 앱 소개 |
| `/home` | 홈 피드 | 내 주변 상품 목록, 검색, 카테고리/반경 필터 |
| `/write` | 상품 등록 | 이미지 업로드, 제목/가격/설명/카테고리, 위치 인증 |
| `/items/[id]` | 상품 상세 | 이미지, 판매자 정보, 위치인증 배지, Pi 구매 버튼 |
| `/chat` | 채팅 목록 | 진행 중인 채팅방 목록, 안 읽은 메시지 수 |
| `/chat/[roomId]` | 채팅방 | Realtime 1:1 채팅, 상품 정보 헤더 |
| `/my` | 마이페이지 | 프로필, 등록한 상품, 구매/판매 내역 |
| `/location-verify` | 위치 인증 | GPS 인증 진행, 현재 위치 확인 |

## 하단 네비게이션 (Bottom Nav)
- 홈 | 동네생활 | 글쓰기(+) | 채팅 | 나의거래

---

## Pi 결제 플로우

```
1. 구매자 "Pi로 구매" 버튼 클릭
2. Pi.createPayment({ amount, memo, metadata: { itemId } }) 호출
3. Pi Browser 결제 UI 팝업
4. onReadyForServerApproval(paymentId)
   → POST /api/payments/approve
   → Pi API로 paymentId 검증
   → Supabase transactions 테이블에 pending 상태로 저장
   → Pi API approve 호출
5. onReadyForServerCompletion(paymentId, txid)
   → POST /api/payments/complete
   → Pi API complete 호출
   → Supabase transactions 상태를 completed로 업데이트
   → items 테이블 status를 sold로 업데이트
   → 채팅방에 거래 완료 알림 메시지 전송
```

---

## 위치 인증 상세 로직

```
1. 사용자가 상품 등록 클릭
2. 브라우저 GPS 권한 요청 → getCurrentPosition()
3. 좌표 획득 → Nominatim으로 행정구역명(동/읍/면) 추출
4. POST /api/location/verify 로 서버에 좌표 전송
5. 서버에서 좌표와 입력 주소 일치 여부 검증
6. 검증 통과 시 items 테이블에 { location, district, location_verified_at } 저장
7. 등록 완료 → 24시간 동안 "위치인증" 배지 표시
8. 24시간 경과 → "재인증 필요" 상태로 변경 (서버에서 계산)
9. 판매자 재인증 → 새 GPS 좌표로 location_verified_at 갱신
```

---

## 위치 기반 상품 조회 쿼리 (PostGIS)

```sql
-- 반경 5km 이내 상품 조회 (판매 중인 상품만)
select
  items.*,
  ST_Distance(location, ST_MakePoint($lng, $lat)::geography) as distance_m
from items
where
  status = 'selling'
  and ST_DWithin(
    location,
    ST_MakePoint($lng, $lat)::geography,
    5000   -- 5km (미터 단위)
  )
order by distance_m asc;
```

---

## 환경변수 (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # 서버 전용 (절대 클라이언트 노출 금지)

# Pi Network
PI_API_KEY=your-pi-api-key                         # Pi Developer Portal에서 발급
NEXT_PUBLIC_PI_SANDBOX=true                        # 개발: true, 프로덕션: false

# App
NEXT_PUBLIC_APP_URL=https://mygoods.vercel.app
```

---

## Pi SDK 초기화 (layout.tsx)

```typescript
// 클라이언트 컴포넌트에서 Pi SDK 초기화
'use client';
useEffect(() => {
  if (typeof window !== 'undefined' && window.Pi) {
    Pi.init({
      version: "2.0",
      sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true'
    });
  }
}, []);
```

---

## 카테고리 목록

| 키 | 표시명 |
|----|--------|
| `digital` | 디지털/가전 |
| `furniture` | 가구/인테리어 |
| `kitchen` | 생활/주방 |
| `women_clothes` | 여성의류 |
| `men_clothes` | 남성의류 |
| `kids` | 유아동 |
| `sports` | 스포츠/레저 |
| `books` | 도서/티켓/음반 |
| `beauty` | 뷰티/미용 |
| `pets` | 반려동물 |
| `etc` | 기타 |

---

## Supabase Row Level Security (RLS) 정책 방향

- **items**: 누구나 읽기 가능 / 본인만 insert·update·delete
- **messages**: 해당 채팅방의 buyer 또는 seller만 읽기·쓰기
- **transactions**: 해당 거래의 buyer 또는 seller만 읽기
- **users**: 본인 레코드만 읽기·수정

---

## Vercel 배포 설정

```json
// vercel.json (필요 시)
{
  "regions": ["icn1"],          // 서울 리전 우선
  "framework": "nextjs"
}
```

- `main` 브랜치 push → Vercel 자동 프로덕션 배포
- PR 생성 시 Preview URL 자동 생성
- 환경변수는 Vercel 대시보드에서 설정

---

## 보안 고려사항

- Pi 결제 승인/완료는 **반드시 서버(API Route)에서 처리** (클라이언트 조작 방지)
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 코드에서만 사용, 절대 클라이언트에 노출 금지
- GPS 좌표는 서버에서 2차 검증 (클라이언트 조작 방지)
- 사용자 식별은 Pi UID 사용 (pi_username은 변경 가능하므로 식별자로 사용 금지)
- Supabase RLS 활성화 필수 (직접 DB 접근 시 권한 제어)
- 이미지 업로드 시 파일 타입·크기 서버에서 검증

---

## 개발 순서 권장

1. Supabase 프로젝트 생성 → 스키마 마이그레이션 → RLS 설정
2. Next.js 프로젝트 생성 (`create-next-app`) + Tailwind + Supabase 클라이언트 설정
3. Pi 로그인 (`/api/auth/pi`) → 세션 관리 구현
4. 상품 등록/조회 (이미지 업로드 포함) → 위치 인증 연동
5. PostGIS 반경 검색 쿼리 → 홈 피드 구현
6. Pi 결제 API Routes 구현 → 결제 플로우 연동
7. Supabase Realtime 채팅 구현
8. 마이페이지 / 거래내역
9. Vercel 배포 → Pi Developer Portal에 도메인 등록
