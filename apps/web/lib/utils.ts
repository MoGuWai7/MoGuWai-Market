// 공통 유틸리티 함수 — 가격 포맷, 날짜 포맷 등

/** 가격을 한국 원화 형식으로 변환 (예: 1500000 → "150만원") */
export function formatPrice(price: number): string {
  if (price >= 10000) {
    const man = price / 10000;
    return Number.isInteger(man) ? `${man}만원` : `${man.toFixed(1)}만원`;
  }
  return `${price.toLocaleString()}원`;
}

/** 가격을 풀 포맷으로 변환 (예: 1500000 → "1,500,000원") */
export function formatPriceFull(price: number): string {
  return `${price.toLocaleString()}원`;
}

/** 날짜를 상대 시간으로 변환 (예: "3분 전", "2일 전") */
export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

/** 판매 상태 한글 변환 */
export function formatProductStatus(
  status: "selling" | "reserved" | "sold"
): string {
  const map = { selling: "판매중", reserved: "예약중", sold: "판매완료" };
  return map[status];
}

/** Tailwind 클래스 조합 헬퍼 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
