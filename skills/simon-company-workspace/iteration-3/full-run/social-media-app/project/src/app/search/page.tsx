"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";

interface UserResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function SearchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.users);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="사용자 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-neutral-100 rounded-2xl text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border focus:border-indigo-500 transition-all"
          autoFocus
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-1">
          {results.map((user) => (
            <Link
              key={user.id}
              href={`/${user.username}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <Avatar src={user.avatarUrl} alt={user.username} size="md" />
              <div>
                <p className="font-semibold text-sm">{user.username}</p>
                {user.displayName && (
                  <p className="text-sm text-neutral-500">{user.displayName}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : searched ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="검색 결과가 없습니다"
          description="다른 사용자명으로 검색해보세요"
        />
      ) : (
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="사용자를 검색하세요"
          description="사용자명이나 이름으로 검색할 수 있습니다"
        />
      )}
    </div>
  );
}
