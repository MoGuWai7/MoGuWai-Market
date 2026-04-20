// 상품 카드 컴포넌트 — 홈/목록에서 공통 사용
// - 당근마켓 스타일: 세련된 둥근 카드, 호버 시 부드러운 확대, 상태 뱃지
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { formatPrice, formatTimeAgo, cn } from "@/lib/utils";

const STATUS_LABEL = { selling: "판매중", reserved: "예약중", sold: "판매완료" } as const;
const STATUS_STYLE = {
  selling:  "bg-[var(--brand-500)] text-white",
  reserved: "bg-amber-500 text-white",
  sold:     "bg-neutral-700 text-white",
} as const;

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const isSold = product.status === "sold";
  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group block",
        isSold && "opacity-70",
        className,
      )}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-neutral-100 rounded-2xl overflow-hidden">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-5xl">
            📦
          </div>
        )}

        {/* 판매중이 아닐 때만 상태 뱃지 오버레이 */}
        {product.status !== "selling" && (
          <div className="absolute top-2 left-2">
            <span className={cn("text-[11px] font-bold px-2 py-1 rounded-lg", STATUS_STYLE[product.status])}>
              {STATUS_LABEL[product.status]}
            </span>
          </div>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div className="pt-3 px-1">
        <p className="text-[14px] text-neutral-900 line-clamp-2 leading-snug">
          {product.title}
        </p>
        <p className="mt-1 text-[15px] font-bold text-neutral-900 tabular-nums">
          {formatPrice(product.price)}
        </p>
        <div className="mt-1 flex items-center justify-between text-[12px] text-neutral-400">
          <span>{formatTimeAgo(product.created_at)}</span>
          <span className="flex items-center gap-0.5">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
            </svg>
            {product.favorite_count}
          </span>
        </div>
      </div>
    </Link>
  );
}
