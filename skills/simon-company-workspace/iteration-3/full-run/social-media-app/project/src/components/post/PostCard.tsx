"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Trash2, MoreHorizontal } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { formatRelativeTime, cn } from "@/lib/utils";

interface PostCardProps {
  post: {
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
    author: { id: string; username: string; avatarUrl: string | null };
    _count: { likes: number; comments: number };
    isLiked: boolean;
  };
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = session?.user?.id === post.author.id;

  const handleLike = async () => {
    if (!session) return;

    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);

    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: newLiked ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setIsLiked(!newLiked);
        setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    } catch {
      setIsLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 게시물을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.();
      }
    } catch {
      // ignore
    }
    setShowMenu(false);
  };

  return (
    <article className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={`/${post.author.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.username}
            size="md"
          />
          <span className="font-semibold text-sm text-neutral-900 group-hover:text-indigo-600 transition-colors">
            {post.author.username}
          </span>
        </Link>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-neutral-500" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-neutral-100">
        <Image
          src={post.imageUrl}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="group p-0.5"
            disabled={!session}
          >
            <Heart
              className={cn(
                "w-6 h-6 transition-all duration-200",
                isLiked
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-700 group-hover:text-red-500",
                likeAnimating && "scale-125"
              )}
            />
          </button>
          <Link href={`/post/${post.id}`} className="group p-0.5">
            <MessageCircle className="w-6 h-6 text-neutral-700 group-hover:text-indigo-500 transition-colors" />
          </Link>
        </div>

        {/* Like count */}
        <p className="font-semibold text-sm mt-2 text-neutral-900">
          좋아요 {likeCount.toLocaleString()}개
        </p>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-1">
          <p className="text-sm text-neutral-800">
            <Link
              href={`/${post.author.username}`}
              className="font-semibold hover:text-indigo-600 transition-colors"
            >
              {post.author.username}
            </Link>{" "}
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments link */}
      {post._count.comments > 0 && (
        <Link
          href={`/post/${post.id}`}
          className="block px-4 pb-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          댓글 {post._count.comments}개 모두 보기
        </Link>
      )}

      {/* Time */}
      <p className="px-4 pb-3 text-[11px] text-neutral-400 uppercase tracking-wide">
        {formatRelativeTime(post.createdAt)}
      </p>
    </article>
  );
}
