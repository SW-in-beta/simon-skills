"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, X, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function CreatePostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 크기는 5MB 이하여야 합니다");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("JPEG, PNG, WebP만 허용됩니다");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("이미지를 선택하세요");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", image);
      if (caption.trim()) formData.append("caption", caption.trim());

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "게시물 작성에 실패했습니다");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("게시물 작성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">새 게시물</h1>
        <div className="w-9" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image upload area */}
        {preview ? (
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100">
            <Image
              src={preview}
              alt="미리보기"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-2xl border-2 border-dashed border-neutral-300 hover:border-indigo-400 bg-neutral-50 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-3 transition-all duration-200 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-pink-200 transition-colors">
              <ImagePlus className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-700">
                사진을 선택하세요
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                JPEG, PNG, WebP (최대 5MB)
              </p>
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Caption */}
        <div>
          <textarea
            placeholder="캡션을 입력하세요..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl resize-none placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
          />
          <p className="text-xs text-neutral-400 text-right mt-1">
            {caption.length}/2000
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} disabled={!image}>
          게시하기
        </Button>
      </form>
    </div>
  );
}
