"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";
import { v4 as uuidv4 } from "uuid";

export default function ProductNewPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, [supabase]);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newImgs = Array.from(files).slice(0, 10 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImgs]);
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(images[i].preview);
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      if (thumbnailIndex >= next.length) setThumbnailIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("제목을 입력해주세요."); return; }
    if (!price || isNaN(Number(price))) { setError("올바른 가격을 입력해주세요."); return; }
    if (!categoryId) { setError("카테고리를 선택해주세요."); return; }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login?next=/products/new"); return; }

    const productId = uuidv4();

    // 이미지 업로드
    const uploadedUrls: string[] = [];
    for (const img of images) {
      const ext = img.file.name.split(".").pop();
      const path = `${user.id}/${productId}/${uuidv4()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, img.file, { cacheControl: "3600" });
      if (uploadError) { setError("이미지 업로드 중 오류가 발생했습니다."); setSubmitting(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      uploadedUrls.push(publicUrl);
    }

    const thumbnailUrl = uploadedUrls[thumbnailIndex] ?? null;

    // 상품 생성
    const { error: insertError } = await supabase.from("products").insert({
      id: productId,
      seller_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim() || null,
      price: Number(price),
      status: "selling",
      thumbnail_url: thumbnailUrl,
    });

    if (insertError) { setError("상품 등록 중 오류가 발생했습니다."); setSubmitting(false); return; }

    // 이미지 레코드 저장
    if (uploadedUrls.length > 0) {
      await supabase.from("product_images").insert(
        uploadedUrls.map((url, i) => ({
          product_id: productId,
          url,
          sort_order: i === thumbnailIndex ? 0 : i < thumbnailIndex ? i + 1 : i,
        }))
      );
    }

    router.push(`/products/${productId}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-sm mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">상품 등록</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상품 사진 (최대 10장)</label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 transition-colors text-xs gap-1"
              >
                <span className="text-2xl">+</span>
                <span>{images.length}/10</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20">
                  <div
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer ${i === thumbnailIndex ? "border-blue-500" : "border-transparent"}`}
                    onClick={() => setThumbnailIndex(i)}
                  >
                    <Image src={img.preview} alt="" width={80} height={80} className="object-cover w-full h-full" />
                  </div>
                  {i === thumbnailIndex && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-blue-500 text-white rounded-b-xl py-0.5">대표</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="상품 제목을 입력하세요"
              maxLength={100}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">카테고리 선택</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min={0}
                className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="상품에 대해 자세히 설명해주세요."
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "등록 중..." : "상품 등록"}
          </button>
        </form>
      </div>
    </main>
  );
}
