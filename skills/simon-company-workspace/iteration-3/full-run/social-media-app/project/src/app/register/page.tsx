"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === "VALIDATION_ERROR") {
          setErrors({ general: data.error.message });
        } else if (data.error?.code === "DUPLICATE_EMAIL") {
          setErrors({ general: data.error.message });
        } else {
          setErrors({ general: "회원가입 중 오류가 발생했습니다" });
        }
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setErrors({ general: "회원가입 중 오류가 발생했습니다" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-4 shadow-lg shadow-indigo-500/25">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
            Picstory
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            친구들의 사진과 동영상을 보려면 가입하세요
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              placeholder="이메일"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              required
            />
            <Input
              id="username"
              placeholder="사용자명 (영문, 숫자, _)"
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              error={errors.username}
              required
            />
            <Input
              id="password"
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={errors.password}
              required
            />

            {errors.general && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl border border-red-100">
                {errors.general}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading}>
              가입하기
            </Button>
          </form>
        </div>

        {/* Login link */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 mt-3 text-center shadow-sm">
          <p className="text-sm text-neutral-600">
            계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
