// 관리자 앱 공통 유틸리티 함수

/** 가격 포맷 (예: 1500000 → "1,500,000원") */
export function formatPrice(price: number): string {
  return `${price.toLocaleString()}원`;
}

/** 날짜 포맷 (예: "2024-01-15 14:32") */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 날짜만 포맷 (예: "2024.01.15") */
export function formatDateOnly(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 상대 시간 (예: "3분 전") */
export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return formatDateOnly(dateStr);
}

/** Tailwind 클래스 조합 헬퍼 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** 판매 상태 한글 변환 */
export function formatProductStatus(
  status: "selling" | "reserved" | "sold"
): string {
  return { selling: "판매중", reserved: "예약중", sold: "판매완료" }[status];
}

/** 신고 상태 한글 변환 */
export function formatReportStatus(
  status: "pending" | "resolved" | "dismissed"
): string {
  return { pending: "미처리", resolved: "처리완료", dismissed: "기각" }[status];
}
