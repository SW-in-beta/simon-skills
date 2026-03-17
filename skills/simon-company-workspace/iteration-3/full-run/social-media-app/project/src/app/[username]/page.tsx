"use client";

import { useEffect, useState, use } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Grid3X3, LogOut, Settings, UserPlus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import PostGrid from "@/components/post/PostGrid";
import EmptyState from "@/components/ui/EmptyState";

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  _count: { posts: number; followers: number; following: number };
  isFollowing: boolean;
}

interface Post {
  id: string;
  imageUrl: string;
  _count: { likes: number; comments: number };
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = session?.user?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setProfile(data.user);
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/users/${username}/posts?limit=30`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
        }
      } catch {
        // ignore
      }
    };

    fetchProfile();
    fetchPosts();
  }, [username, router]);

  const handleFollow = async () => {
    if (!session || !profile || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = profile.isFollowing;

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !wasFollowing,
            _count: {
              ...prev._count,
              followers: prev._count.followers + (wasFollowing ? -1 : 1),
            },
          }
        : null
    );

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: wasFollowing,
                _count: {
                  ...prev._count,
                  followers:
                    prev._count.followers + (wasFollowing ? 1 : -1),
                },
              }
            : null
        );
      }
    } catch {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: wasFollowing,
              _count: {
                ...prev._count,
                followers: prev._count.followers + (wasFollowing ? 1 : -1),
              },
            }
          : null
      );
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 mb-8">
        <Avatar
          src={profile.avatarUrl}
          alt={profile.username}
          size="xl"
          className="w-20 h-20 md:w-36 md:h-36 text-2xl md:text-4xl"
        />

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold">{profile.username}</h1>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push("/settings/profile")}
                  >
                    <Settings className="w-4 h-4" />
                    프로필 편집
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : session ? (
                <Button
                  variant={profile.isFollowing ? "secondary" : "primary"}
                  size="sm"
                  onClick={handleFollow}
                  loading={followLoading}
                >
                  {profile.isFollowing ? "팔로잉" : "팔로우"}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center md:justify-start gap-8 mb-4">
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile._count.posts}</span>
              <span className="text-neutral-500 ml-1 text-sm">게시물</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile._count.followers}</span>
              <span className="text-neutral-500 ml-1 text-sm">팔로워</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-semibold">{profile._count.following}</span>
              <span className="text-neutral-500 ml-1 text-sm">팔로잉</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            {profile.displayName && (
              <p className="font-semibold text-sm">{profile.displayName}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-neutral-600 mt-0.5 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200 mb-4">
        <div className="flex justify-center">
          <div className="flex items-center gap-1 px-4 py-3 border-t-2 border-neutral-900 -mt-px">
            <Grid3X3 className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              게시물
            </span>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <EmptyState
          icon={<Grid3X3 className="w-12 h-12" />}
          title={isOwnProfile ? "아직 게시물이 없습니다" : "게시물 없음"}
          description={
            isOwnProfile
              ? "첫 번째 사진을 공유해보세요"
              : "이 사용자의 게시물이 없습니다"
          }
          action={
            isOwnProfile ? (
              <Button
                size="sm"
                onClick={() => router.push("/create")}
              >
                게시물 작성
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
