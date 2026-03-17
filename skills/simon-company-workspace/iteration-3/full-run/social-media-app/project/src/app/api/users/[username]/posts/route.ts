import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: { select: { likes: true, comments: true } },
        ...(userId
          ? { likes: { where: { userId }, select: { id: true } } }
          : {}),
      },
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    const formattedPosts = data.map((post) => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      _count: post._count,
      isLiked: userId ? (post as unknown as { likes: { id: string }[] }).likes?.length > 0 : false,
    }));

    return NextResponse.json({ posts: formattedPosts, nextCursor });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
