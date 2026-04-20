import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatTimeAgo } from "@/lib/utils";
import type { ChatRoom } from "@/types";

export const revalidate = 0;

export default async function ChatListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/chat");

  const { data } = await supabase
    .from("chat_rooms")
    .select(
      "*, product:products(id,title,thumbnail_url,status), buyer:users!chat_rooms_buyer_id_fkey(id,nickname,avatar_url), seller:users!chat_rooms_seller_id_fkey(id,nickname,avatar_url)"
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const rooms = (data ?? []) as unknown as ChatRoom[];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-sm mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">채팅</h1>
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">채팅이 없습니다.</p>
            <Link href="/products" className="mt-3 inline-block text-sm text-blue-600 hover:underline">상품 둘러보기</Link>
          </div>
        ) : (
          <div className="space-y-1">
            {rooms.map((room) => {
              const other = room.buyer_id === user.id ? room.seller : room.buyer;
              return (
                <Link
                  key={room.id}
                  href={`/chat/${room.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  {/* 상대방 아바타 */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {other?.avatar_url ? (
                      <Image src={other.avatar_url} alt="" width={48} height={48} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
                    )}
                  </div>
                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{other?.nickname ?? "알 수 없음"}</p>
                      {room.last_message_at && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTimeAgo(room.last_message_at)}</span>
                      )}
                    </div>
                    {room.product && (
                      <p className="text-xs text-gray-400 truncate">{room.product.title}</p>
                    )}
                    {room.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{room.last_message}</p>
                    )}
                  </div>
                  {/* 상품 썸네일 */}
                  {room.product?.thumbnail_url && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <Image src={room.product.thumbnail_url} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
