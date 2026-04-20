// 상태 배지 컴포넌트 — 색상 variant 지원 (green/yellow/red/gray/blue)
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "yellow" | "red" | "gray" | "blue" | "orange";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green:  "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  red:    "bg-red-100 text-red-700 border-red-200",
  gray:   "bg-gray-100 text-gray-600 border-gray-200",
  blue:   "bg-blue-100 text-blue-700 border-blue-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function Badge({
  variant = "gray",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── 도메인별 배지 헬퍼 ────────────────────────────────────

export function ProductStatusBadge({
  status,
}: {
  status: "selling" | "reserved" | "sold";
}) {
  const map = {
    selling:  { variant: "green" as BadgeVariant,  label: "판매중" },
    reserved: { variant: "yellow" as BadgeVariant, label: "예약중" },
    sold:     { variant: "gray" as BadgeVariant,   label: "판매완료" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function ReportStatusBadge({
  status,
}: {
  status: "pending" | "resolved" | "dismissed";
}) {
  const map = {
    pending:   { variant: "red" as BadgeVariant,    label: "미처리" },
    resolved:  { variant: "green" as BadgeVariant,  label: "처리완료" },
    dismissed: { variant: "gray" as BadgeVariant,   label: "기각" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function UserRoleBadge({ role }: { role: "user" | "admin" }) {
  return role === "admin" ? (
    <Badge variant="blue">관리자</Badge>
  ) : (
    <Badge variant="gray">일반</Badge>
  );
}

export function UserBanBadge({ isBanned }: { isBanned: boolean }) {
  return isBanned ? (
    <Badge variant="red">차단됨</Badge>
  ) : null;
}
