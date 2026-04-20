"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CategoryActions({ categoryId }: { categoryId: number }) {
  const router = useRouter();
  const supabase = createClient();

  const deleteCategory = async () => {
    if (!confirm("카테고리를 삭제하시겠습니까? (해당 카테고리의 상품이 있으면 삭제되지 않습니다)")) return;
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) alert("삭제 실패: " + error.message);
    else router.refresh();
  };

  return (
    <button onClick={deleteCategory} className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">삭제</button>
  );
}
