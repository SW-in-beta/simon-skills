"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import PostCard from "@/components/post/PostCard";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
  isLiked: boolean;
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchPosts = useCallback(async (cursor?: string) => {
    try {
      const url = cursor
        ? `/api/posts?cursor=${cursor}&limit=10`
        : "/api/posts?limit=10";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session, fetchPosts]);

  useEffect(() => {
    if (!observerRef.current || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          fetchPosts(nextCursor);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchPosts]);

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header - mobile */}
      <div className="md:hidden flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
          Picstory
        </h1>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={<Camera className="w-16 h-16" />}
          title="피드가 비어있습니다"
          description="사진을 공유하거나 다른 사용자를 팔로우해보세요"
          action={
            <div className="flex gap-3">
              <Button onClick={() => router.push("/create")} size="sm">
                게시물 작성
              </Button>
              <Button
                onClick={() => router.push("/search")}
                variant="outline"
                size="sm"
              >
                사용자 검색
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={() => handleDelete(post.id)}
            />
          ))}
          <div ref={observerRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
