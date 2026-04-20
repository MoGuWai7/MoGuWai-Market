import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import type { User, Product } from "@/types";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [userRes, productsRes] = await Promise.all([
    supabase.from("users").select("id,nickname,avatar_url,bio,created_at").eq("id", id).single(),
    supabase
      .from("products")
      .select("id,title,price,status,thumbnail_url,favorite_count,created_at,category:categories(id,name,slug)")
      .eq("seller_id", id)
      .eq("status", "selling")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (userRes.error || !userRes.data) notFound();

  const user = userRes.data as User;
  const products = (productsRes.data ?? []) as Product[];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {/* 프로필 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt="" width={64} height={64} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">👤</div>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{user.nickname}</p>
              {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}
            </div>
          </div>
        </div>

        {/* 판매 상품 */}
        <h2 className="text-sm font-semibold text-gray-700 mb-3">판매 중인 상품 ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">판매 중인 상품이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}
