"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatTimeAgo, cn } from "@/lib/utils";
import type { User, Product, ChatRoom } from "@/types";
import ProductCard from "@/components/product/ProductCard";

type Tab = "selling" | "sold" | "favorites" | "chats";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("selling");
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // 프로필 편집
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login?next=/profile"); return; }

      const [userRes, productsRes, favRes, chatRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", authUser.id).single(),
        supabase.from("products").select("id,title,price,status,thumbnail_url,favorite_count,created_at,category:categories(id,name,slug)").eq("seller_id", authUser.id).order("created_at", { ascending: false }),
        supabase.from("favorites").select("product:products(id,title,price,status,thumbnail_url,favorite_count,created_at,category:categories(id,name,slug))").eq("user_id", authUser.id).order("created_at", { ascending: false }),
        supabase.from("chat_rooms").select("*, product:products(id,title,thumbnail_url,status), buyer:users!chat_rooms_buyer_id_fkey(id,nickname,avatar_url), seller:users!chat_rooms_seller_id_fkey(id,nickname,avatar_url)").or(`buyer_id.eq.${authUser.id},seller_id.eq.${authUser.id}`).order("last_message_at", { ascending: false, nullsFirst: false }),
      ]);

      setUser(userRes.data as User);
      setNickname(userRes.data?.nickname ?? "");
      setBio(userRes.data?.bio ?? "");
      setProducts((productsRes.data ?? []) as unknown as Product[]);
      setFavorites((favRes.data?.map((f: { product: unknown }) => f.product) ?? []) as unknown as Product[]);
      setChats((chatRes.data ?? []) as unknown as ChatRoom[]);
      setLoading(false);
    };
    load();
  }, [router, supabase]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    let avatarUrl = user.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = publicUrl;
    }

    await supabase.from("users").update({ nickname, bio: bio || null, avatar_url: avatarUrl }).eq("id", user.id);
    setUser((u) => u ? { ...u, nickname, bio: bio || null, avatar_url: avatarUrl } : u);
    setEditing(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const sellingProducts = products.filter((p) => p.status === "selling" || p.status === "reserved");
  const soldProducts = products.filter((p) => p.status === "sold");

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "selling", label: "판매중", count: sellingProducts.length },
    { key: "sold", label: "판매완료", count: soldProducts.length },
    { key: "favorites", label: "찜한 상품", count: favorites.length },
    { key: "chats", label: "채팅", count: chats.length },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          {editing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="" width={80} height={80} className="object-cover" />
                    ) : user.avatar_url ? (
                      <Image src={user.avatar_url} alt="" width={80} height={80} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">👤</div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                    }}
                  />
                  <p className="text-xs text-blue-600 text-center mt-1">변경</p>
                </label>
                <div className="flex-1 space-y-3">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="자기소개 (선택)"
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 py-2 text-sm border border-gray-300 rounded-xl">취소</button>
                <button onClick={saveProfile} disabled={saving} className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl disabled:opacity-50">
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt="" width={64} height={64} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">👤</div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{user.nickname}</p>
                {user.bio && <p className="text-sm text-gray-500 mt-0.5">{user.bio}</p>}
                <p className="text-xs text-gray-400 mt-1">{user.email}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                편집
              </button>
            </div>
          )}
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl border border-gray-200 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 py-2 text-xs font-medium rounded-lg transition-colors",
                tab === t.key ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        {(tab === "selling" || tab === "sold") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{tab === "selling" ? sellingProducts.length : soldProducts.length}개</p>
              <Link href="/products/new" className="text-sm text-blue-600 hover:underline">+ 판매하기</Link>
            </div>
            {(tab === "selling" ? sellingProducts : soldProducts).length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">상품이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(tab === "selling" ? sellingProducts : soldProducts).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "favorites" && (
          favorites.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">찜한 상품이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {favorites.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        )}

        {tab === "chats" && (
          chats.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">채팅이 없습니다.</p>
          ) : (
            <div className="space-y-1">
              {chats.map((room) => {
                const other = room.buyer_id === user.id ? room.seller : room.buyer;
                return (
                  <Link
                    key={room.id}
                    href={`/chat/${room.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 hover:bg-gray-50 border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {other?.avatar_url ? (
                        <Image src={other.avatar_url} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">👤</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{other?.nickname}</p>
                      {room.last_message && <p className="text-xs text-gray-500 truncate">{room.last_message}</p>}
                    </div>
                    {room.last_message_at && <span className="text-xs text-gray-400">{formatTimeAgo(room.last_message_at)}</span>}
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>
    </main>
  );
}
