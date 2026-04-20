"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProductAdminActions({ productId }: { productId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const deleteProduct = async () => {
    if (!confirm("상품을 강제 삭제하시겠습니까?")) return;
    await supabase.from("products").delete().eq("id", productId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_action_logs").insert({
        admin_id: user.id,
        action: "delete_product",
        target_type: "product",
        target_id: productId,
      });
    }
    router.refresh();
  };

  return (
    <button onClick={deleteProduct} className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700">
      삭제
    </button>
  );
}
