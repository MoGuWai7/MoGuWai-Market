// 관리자 앱 전체 도메인 타입 — DB 스키마 기반

export type UserRole = "user" | "admin";
export type ProductStatus = "selling" | "reserved" | "sold";
export type ReportTargetType = "product" | "user";
export type ReportStatus = "pending" | "resolved" | "dismissed";

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
  seller?: Pick<User, "id" | "nickname" | "email">;
  category?: Pick<Category, "id" | "name">;
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
  reporter?: Pick<User, "id" | "nickname" | "email">;
}

export interface AdminActionLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
  admin?: Pick<User, "id" | "nickname">;
}

// ─── 관리자 대시보드 통계 타입 ────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  pendingReports: number;
  todaySignups: number;
}

// ─── 쿼리 파라미터 ────────────────────────────────────────

export interface AdminTableParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ProductAdminParams extends AdminTableParams {
  status?: ProductStatus | "all";
  category_id?: number;
}

export interface ReportAdminParams extends AdminTableParams {
  status?: ReportStatus | "all";
  target_type?: ReportTargetType | "all";
}
