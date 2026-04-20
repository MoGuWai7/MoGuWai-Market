"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product, ProductStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [status, setStatus] = useState<ProductStatus>("selling");
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; sort_order: number }[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*, images:product_images(id,url,sort_order)").eq("id", id).single(),
      ]);

      if (prodRes.error || !prodRes.data || prodRes.data.seller_id !== user.id) {
        router.replace(`/products/${id}`);
        return;
      }

      const p = prodRes.data as unknown as Product;
      setCategories((catRes.data ?? []) as unknown as Category[]);
      setTitle(p.title);
      setDescription(p.description ?? "");
      setPrice(String(p.price));
      setCategoryId(p.category_id);
      setStatus(p.status);
      setThumbnailUrl(p.thumbnail_url);
      const imgs = ((p.images ?? []) as { id: string; url: string; sort_order: number }[]).sort((a, b) => a.sort_order - b.sort_order);
      setExistingImages(imgs);
      setLoading(false);
    };
    load();
  }, [id, router, supabase]);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const total = existingImages.length + newImages.length;
    const added = Array.from(files).slice(0, 10 - total).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...added]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("제목을 입력해주세요."); return; }
    if (!price || isNaN(Number(price))) { setError("올바른 가격을 입력해주세요."); return; }
    if (!categoryId) { setError("카테고리를 선택해주세요."); return; }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 새 이미지 업로드
    const newUrls: string[] = [];
    for (const img of newImages) {
      const ext = img.file.name.split(".").pop();
      const path = `${user.id}/${id}/${uuidv4()}.${ext}`;
      const { error: err } = await supabase.storage.from("product-images").upload(path, img.file);
      if (err) { setError("이미지 업로드 오류"); setSubmitting(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      newUrls.push(publicUrl);
    }

    // 새 이미지 레코드 삽입
    if (newUrls.length > 0) {
      const maxSort = existingImages.length > 0 ? Math.max(...existingImages.map((i) => i.sort_order)) + 1 : 0;
      await supabase.from("product_images").insert(
        newUrls.map((url, i) => ({ product_id: id, url, sort_order: maxSort + i }))
      );
    }

    const allUrls = [...existingImages.map((i) => i.url), ...newUrls];
    const newThumb = thumbnailUrl && allUrls.includes(thumbnailUrl) ? thumbnailUrl : allUrls[0] ?? null;

    await supabase.from("products").update({
      title: title.trim(),
      description: description.trim() || null,
      price: Number(price),
      category_id: categoryId,
      status,
      thumbnail_url: newThumb,
    }).eq("id", id);

    router.push(`/products/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-sm mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">상품 수정</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          {/* 기존 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상품 사진</label>
            <div className="flex gap-2 flex-wrap">
              {existingImages.map((img) => (
                <div key={img.id} className="relative w-20 h-20">
                  <div
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer ${img.url === thumbnailUrl ? "border-blue-500" : "border-transparent"}`}
                    onClick={() => setThumbnailUrl(img.url)}
                  >
                    <Image src={img.url} alt="" width={80} height={80} className="object-cover w-full h-full" />
                  </div>
                  {img.url === thumbnailUrl && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-blue-500 text-white rounded-b-xl py-0.5">대표</span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from("product_images").delete().eq("id", img.id);
                      setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
                      if (thumbnailUrl === img.url) setThumbnailUrl(null);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {existingImages.length + newImages.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-gray-400 text-2xl"
                >
                  +
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">판매 상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="selling">판매중</option>
              <option value="reserved">예약중</option>
              <option value="sold">판매완료</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
