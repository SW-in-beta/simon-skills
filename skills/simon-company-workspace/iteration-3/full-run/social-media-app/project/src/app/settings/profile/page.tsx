"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${session.user.username}`);
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.user.displayName || "");
          setBio(data.user.bio || "");
          setAvatarPreview(data.user.avatarUrl);
          setProfileLoaded(true);
        }
      } catch {
        // ignore
      }
    };

    fetchProfile();
  }, [session, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 크기는 5MB 이하여야 합니다");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("displayName", displayName);
      formData.append("bio", bio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch("/api/users/me", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "프로필 업데이트에 실패했습니다");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${session?.user.username}`);
        router.refresh();
      }, 1000);
    } catch {
      setError("프로필 업데이트 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (!profileLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/${session?.user.username}`}
          className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">프로필 편집</h1>
        <div className="w-9" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-pink-400">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="프로필 사진"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                  {session?.user.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
              <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-sm text-neutral-500 mt-2">
            프로필 사진 변경
          </p>
        </div>

        {/* Fields */}
        <Input
          id="displayName"
          label="표시 이름"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          placeholder="표시 이름"
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            자기소개
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="자기소개를 입력하세요"
            className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl resize-none placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
          />
          <p className="text-xs text-neutral-400 text-right mt-1">
            {bio.length}/200
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 text-sm px-4 py-2.5 rounded-xl border border-green-100">
            프로필이 업데이트되었습니다
          </div>
        )}

        <Button type="submit" fullWidth loading={loading}>
          저장
        </Button>
      </form>
    </div>
  );
}
