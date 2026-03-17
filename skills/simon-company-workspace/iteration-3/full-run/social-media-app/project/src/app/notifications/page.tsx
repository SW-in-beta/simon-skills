"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { formatRelativeTime, cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  read: boolean;
  createdAt: string;
  actor: { id: string; username: string; avatarUrl: string | null };
  post?: { id: string; imageUrl: string } | null;
}

const typeConfig = {
  LIKE: { icon: Heart, text: "님이 게시물을 좋아합니다", color: "text-red-500" },
  COMMENT: { icon: MessageCircle, text: "님이 댓글을 달았습니다", color: "text-indigo-500" },
  FOLLOW: { icon: UserPlus, text: "님이 팔로우했습니다", color: "text-green-500" },
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?limit=50");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    fetch("/api/notifications/read", { method: "PUT" }).catch(() => {});
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">알림</h1>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-16 h-16" />}
          title="아직 알림이 없습니다"
          description="다른 사용자가 팔로우하거나 게시물에 반응하면 알림이 표시됩니다"
        />
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <Link
                key={notification.id}
                href={
                  notification.post
                    ? `/post/${notification.post.id}`
                    : `/${notification.actor.username}`
                }
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-neutral-50",
                  !notification.read && "bg-indigo-50/50"
                )}
              >
                <div className="relative">
                  <Avatar
                    src={notification.actor.avatarUrl}
                    alt={notification.actor.username}
                    size="md"
                  />
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center",
                      config.color
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {notification.actor.username}
                    </span>
                    {config.text}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>

                {notification.post && (
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                    <Image
                      src={notification.post.imageUrl}
                      alt="게시물"
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
