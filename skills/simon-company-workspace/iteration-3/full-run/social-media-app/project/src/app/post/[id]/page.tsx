"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { formatRelativeTime, cn } from "@/lib/utils";

interface Post {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
  isLiked: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setPost(data.post);
        setIsLiked(data.post.isLiked);
        setLikeCount(data.post._count.likes);
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/posts/${id}/comments?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments);
        }
      } catch {
        // ignore
      }
    };

    fetchPost();
    fetchComments();
  }, [id, router]);

  const handleLike = async () => {
    if (!session) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const res = await fetch(`/api/posts/${id}/like`, {
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

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">게시물</h1>
        <div className="w-9" />
      </div>

      {/* Post */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Post Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={`/${post.author.username}`}>
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.username}
              size="md"
            />
          </Link>
          <Link
            href={`/${post.author.username}`}
            className="font-semibold text-sm hover:text-indigo-600 transition-colors"
          >
            {post.author.username}
          </Link>
        </div>

        {/* Image */}
        <div className="relative aspect-square bg-neutral-100">
          <Image
            src={post.imageUrl}
            alt={post.caption || "게시물 이미지"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>

        {/* Actions */}
        <div className="px-4 pt-3">
          <button onClick={handleLike} disabled={!session}>
            <Heart
              className={cn(
                "w-6 h-6 transition-all",
                isLiked
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-700 hover:text-red-500"
              )}
            />
          </button>
          <p className="font-semibold text-sm mt-2">
            좋아요 {likeCount.toLocaleString()}개
          </p>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 py-1">
            <p className="text-sm">
              <span className="font-semibold">{post.author.username}</span>{" "}
              {post.caption}
            </p>
          </div>
        )}

        <p className="px-4 pb-3 text-[11px] text-neutral-400">
          {formatRelativeTime(post.createdAt)}
        </p>

        {/* Comments */}
        <div className="border-t border-neutral-100">
          {comments.length > 0 && (
            <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Link href={`/${comment.author.username}`}>
                    <Avatar
                      src={comment.author.avatarUrl}
                      alt={comment.author.username}
                      size="sm"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link
                        href={`/${comment.author.username}`}
                        className="font-semibold hover:text-indigo-600 transition-colors"
                      >
                        {comment.author.username}
                      </Link>{" "}
                      {comment.content}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {formatRelativeTime(comment.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          {session && (
            <form
              onSubmit={handleComment}
              className="flex items-center gap-3 px-4 py-3 border-t border-neutral-100"
            >
              <Avatar
                src={session.user.image}
                alt={session.user.username}
                size="sm"
              />
              <input
                type="text"
                placeholder="댓글 달기..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-neutral-400"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="text-indigo-500 font-semibold text-sm disabled:opacity-40 hover:text-indigo-600 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
