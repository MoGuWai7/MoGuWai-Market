// 프로젝트 전체 도메인 타입 — DB 스키마 기반으로 정의

export type UserRole = "user" | "admin";
export type ProductStatus = "selling" | "reserved" | "sold";
export type ReportTargetType = "product" | "user";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ProductSortKey = "latest" | "price_asc" | "price_desc" | "popular";

// ─── 엔티티 타입 ────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: number;
  title: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  view_count: number;
  favorite_count: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  seller?: Pick<User, "id" | "nickname" | "avatar_url">;
  category?: Pick<Category, "id" | "name" | "slug">;
  images?: ProductImage[];
  is_favorited?: boolean; // 현재 로그인 유저의 찜 여부
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number; // 0이 대표 이미지
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  product_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  // 조인 데이터
  product?: Pick<Product, "id" | "title" | "thumbnail_url" | "status">;
  buyer?: Pick<User, "id" | "nickname" | "avatar_url">;
  seller?: Pick<User, "id" | "nickname" | "avatar_url">;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Pick<User, "id" | "nickname" | "avatar_url">;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ─── 쿼리 파라미터 타입 ────────────────────────────────────

export interface ProductQueryParams {
  search?: string;
  category_id?: number;
  status?: ProductStatus | "all";
  sort?: ProductSortKey;
  page?: number;
  limit?: number;
}

// ─── 폼 입력 타입 ─────────────────────────────────────────

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  category_id: number;
  status: ProductStatus;
  images: File[]; // 업로드할 이미지 파일
  thumbnail_index: number; // 대표 이미지 인덱스
}

export interface ReportFormData {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  description: string;
}

// ─── 공통 응답 타입 ──────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
