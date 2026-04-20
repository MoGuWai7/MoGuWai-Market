// 정렬 select — URL searchParam을 변경해 Server Component 재렌더를 트리거
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ProductSortKey } from "@/types";

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: "latest",     label: "최신순" },
  { value: "popular",    label: "인기순" },
  { value: "price_asc",  label: "낮은 가격순" },
  { value: "price_desc", label: "높은 가격순" },
];

export default function SortSelect({ current }: { current: ProductSortKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "latest") params.delete("sort");
    else params.set("sort", value);
    params.delete("page"); // 정렬 변경 시 1페이지로 초기화
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="정렬"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
