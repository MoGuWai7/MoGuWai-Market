# MoGuWai Market

중고거래 플랫폼 MVP 포트폴리오 프로젝트입니다.

**사용자는** 상품을 검색하고 카테고리별로 둘러볼 수 있습니다.
마음에 드는 상품은 찜하고, 판매자와 실시간 채팅으로 거래를 진행합니다.
본인 상품을 직접 등록·수정·삭제하고 판매 상태도 관리할 수 있습니다.

**관리자는** 별도 대시보드에서 회원·상품·신고·카테고리를 한곳에서 관리합니다.
운영 로그를 통해 모든 관리자 액션을 감사(audit)할 수 있습니다.

**모바일 앱**은 Web과 동일한 기능을 Expo(React Native)로 제공합니다.
Android edge-to-edge 및 기기별 키보드 처리까지 실기기 대응이 완료되어 있습니다.

**배포 주소**: https://moguwai-market.vercel.app

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000?logo=expo)
![Turborepo](https://img.shields.io/badge/Turborepo-pnpm_monorepo-EF4444?logo=turborepo)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 화면 구성

### 사용자 웹 (apps/web)

| 페이지 | 주소 | 설명 |
|--------|------|------|
| 홈 | `/` | 최신 상품 · 인기 상품 · 카테고리 섹션 |
| 상품 목록 | `/products` | 검색 · 카테고리 · 정렬 · 페이지네이션 |
| 상품 상세 | `/products/[id]` | 이미지 갤러리, 찜, 채팅하기, 신고 |
| 상품 등록 | `/products/new` | 다중 이미지 업로드, 대표 이미지 지정 |
| 상품 수정 | `/products/[id]/edit` | 상태 변경(판매중/예약중/판매완료) |
| 채팅 목록 | `/chat` | 참여 채팅방 목록, 마지막 메시지 미리보기 |
| 채팅방 | `/chat/[id]` | Supabase Realtime 실시간 메시지 |
| 마이페이지 | `/profile` | 판매중 · 판매완료 · 찜 · 채팅 탭 |
| 프로필 | `/profile/[id]` | 타 사용자 상품 목록 조회 |
| 로그인 | `/login` | 이메일 · 비밀번호 |
| 회원가입 | `/register` | 이메일 · 닉네임 · 비밀번호 |

### 관리자 (apps/admin)

| 페이지 | 주소 | 설명 |
|--------|------|------|
| 대시보드 | `/` | 회원수 · 상품수 · 미처리 신고 · 오늘 가입 통계 |
| 회원 관리 | `/users` | 목록 검색, 정지 · 해제 |
| 상품 관리 | `/products` | 전체 상품 검색, 강제 삭제 |
| 신고 관리 | `/reports` | 처리완료 · 기각, 상태 필터 |
| 카테고리 관리 | `/categories` | 추가 · 수정 · 삭제 |
| 운영 로그 | `/logs` | 관리자 액션 감사 기록 |

### 모바일 앱 (apps/app)

Web과 동일한 기능. 탭 네비게이션(홈 · 상품 · 채팅 · 마이)으로 구성.
Android edge-to-edge 및 기기별 키보드 처리(S10e / A15 동시 대응) 완료.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router), TypeScript 5 |
| 모바일 | Expo SDK 54, React Native 0.81, Expo Router |
| 스타일 | Tailwind CSS v4 (Web · Admin), StyleSheet (App) |
| 백엔드 / DB | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| 모노레포 | pnpm workspace, Turborepo |
| 배포 | Vercel (Web · Admin), EAS Build (App) |

---

## 로컬 실행

```bash
# 패키지 설치
pnpm install

# 환경변수 설정
cp apps/web/.env.local.example apps/web/.env.local
cp apps/admin/.env.local.example apps/admin/.env.local
cp apps/app/.env.example apps/app/.env
# 각 파일에 Supabase 키 입력 후 저장

# 전체 개발 서버 실행
pnpm dev

# 개별 실행
pnpm --filter web dev        # localhost:3000
pnpm --filter admin dev      # localhost:3001
pnpm --filter app start      # Expo Go
```

### 환경변수

**Web / Admin** (`apps/web/.env.local`, `apps/admin/.env.local`)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개 키 |
| `NEXT_PUBLIC_ADMIN_URL` | 관리자 사이트 URL (선택) |

**App** (`apps/app/.env`)

| 변수 | 설명 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개 키 |

### Supabase 초기 설정

Supabase Dashboard → SQL Editor에서 순서대로 실행:

```
supabase/01_tables.sql     테이블 + 인덱스
supabase/02_rls.sql        RLS 정책
supabase/03_triggers.sql   트리거 + Realtime Publication
supabase/04_storage.sql    Storage 버킷 + 정책
supabase/05_functions.sql  RPC 함수
```

---

## License

MIT License © 2026 [MoGuWai](https://github.com/moguwai7)

코드 참고는 자유롭게 하되, 그대로 복사해 배포하는 것은 삼가주세요.
