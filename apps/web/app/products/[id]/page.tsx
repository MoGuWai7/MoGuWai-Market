"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatTimeAgo, formatProductStatus, cn } from "@/lib/utils";
import type { Product, User } from "@/types";
import ReportModal from "@/components/product/ReportModal";

const STATUS_STYLE = {
  selling: "bg-green-100 text-green-700",
  reserved: "bg-yellow-100 text-yellow-700",
  sold: "bg-gray-100 text-gray-500",
} as const;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const [productRes, userRes] = await Promise.all([
      supabase
        .from("products")
        .select(
          "*, seller:users!products_seller_id_fkey(id,nickname,avatar_url), category:categories(id,name,slug), images:product_images(id,url,sort_order)"
        )
        .eq("id", id)
        .single(),
      user
        ? supabase.from("users").select("*").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);

    if (productRes.error || !productRes.data) {
      router.replace("/products");
      return;
    }

    // 조회수 증가 — Supabase PostgrestBuilder는 thenable이지만 Promise 가 아니므로 .catch 대신 try/catch 사용
    try {
      await supabase.rpc("increment_view_count" as never, { product_id: id });
    } catch { /* 조회수 증가 실패는 무시 */ }

    const p = productRes.data as Product;
    if (p.images) {
      p.images.sort((a, b) => a.sort_order - b.sort_order);
    }

    setProduct(p);
    setCurrentUser(userRes.data as User | null);

    if (user) {
      const { data: fav } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle();
      setIsFavorited(!!fav);
    }
    setLoading(false);
  }, [id, router, supabase]);

  useEffect(() => { load(); }, [load]);

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?next=/products/${id}`); return; }
    setFavoriteLoading(true);
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
      setIsFavorited(false);
      setProduct((p) => p ? { ...p, favorite_count: p.favorite_count - 1 } : p);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
      setIsFavorited(true);
      setProduct((p) => p ? { ...p, favorite_count: p.favorite_count + 1 } : p);
    }
    setFavoriteLoading(false);
  };

  const startChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?next=/products/${id}`); return; }
    if (!product) return;
    if (user.id === product.seller_id) return;

    const { data: existing } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("product_id", id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    const { data: room } = await supabase
      .from("chat_rooms")
      .insert({ product_id: id, buyer_id: user.id, seller_id: product.seller_id })
      .select("id")
      .single();

    if (room) router.push(`/chat/${room.id}`);
  };

  const deleteProduct = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("products").delete().eq("id", id);
    router.push("/profile");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : product.thumbnail_url
    ? [{ id: "thumb", url: product.thumbnail_url, sort_order: 0, product_id: id, created_at: "" }]
    : [];
  const isSeller = currentUser?.id === product.seller_id;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          ← 목록으로
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* 이미지 갤러리 */}
            <div className="p-4">
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {images[selectedImage] ? (
                  <Image
                    src={images[selectedImage].url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
                )}
                {product.status !== "selling" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full", STATUS_STYLE[product.status])}>
                      {formatProductStatus(product.status)}
                    </span>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                        i === selectedImage ? "border-blue-500" : "border-transparent"
                      )}
                    >
                      <div className="relative w-full h-full">
                        <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="p-6 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{product.title}</h1>
                <span className={cn("flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full", STATUS_STYLE[product.status])}>
                  {formatProductStatus(product.status)}
                </span>
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>

              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span>{product.category?.name ?? "기타"}</span>
                <span>·</span>
                <span>조회 {product.view_count}</span>
                <span>·</span>
                <span>관심 {product.favorite_count}</span>
                <span>·</span>
                <span>{formatTimeAgo(product.created_at)}</span>
              </div>

              {/* 판매자 정보 */}
              {product.seller && (
                <Link
                  href={`/profile/${product.seller.id}`}
                  className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {product.seller.avatar_url ? (
                      <Image src={product.seller.avatar_url} alt="" width={40} height={40} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">👤</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{product.seller.nickname}</p>
                    <p className="text-xs text-gray-400">판매자 프로필 보기</p>
                  </div>
                </Link>
              )}

              {/* 설명 */}
              {product.description && (
                <div className="mt-4 flex-1">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">상품 설명</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="mt-6 space-y-2">
                {isSeller ? (
                  <div className="flex gap-2">
                    <Link
                      href={`/products/${id}/edit`}
                      className="flex-1 text-center py-2.5 text-sm font-semibold border border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
                    >
                      수정
                    </Link>
                    <button
                      onClick={deleteProduct}
                      className="flex-1 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={toggleFavorite}
                      disabled={favoriteLoading}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors",
                        isFavorited
                          ? "bg-red-50 border-red-200 text-red-600"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      )}
                    >
                      {isFavorited ? "♥" : "♡"} {product.favorite_count}
                    </button>
                    <button
                      onClick={startChat}
                      disabled={product.status === "sold"}
                      className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      채팅으로 구매하기
                    </button>
                  </div>
                )}
                {!isSeller && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    신고하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReport && (
        <ReportModal
          targetType="product"
          targetId={id}
          onClose={() => setShowReport(false)}
        />
      )}
    </main>
  );
}
