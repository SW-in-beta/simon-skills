"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

interface PostGridProps {
  posts: {
    id: string;
    imageUrl: string;
    _count: { likes: number; comments: number };
  }[];
}

export default function PostGrid({ posts }: PostGridProps) {
  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-1">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-square bg-neutral-100 group overflow-hidden"
        >
          <Image
            src={post.imageUrl}
            alt="게시물"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, 300px"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-4 text-white font-semibold text-sm">
              <span className="flex items-center gap-1">
                <Heart className="w-5 h-5 fill-white" />
                {post._count.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-5 h-5 fill-white" />
                {post._count.comments}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
