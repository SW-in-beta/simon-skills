import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUserId } from "@/lib/auth-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    let followingIds: string[] = [];
    if (userId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      followingIds = follows.map((f) => f.followingId);
      followingIds.push(userId);
    }

    const posts = await prisma.post.findMany({
      where: userId ? { userId: { in: followingIds } } : {},
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

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const caption = formData.get("caption") as string | null;

    if (!image) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "이미지를 선택하세요" } },
        { status: 400 }
      );
    }

    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "이미지 크기는 5MB 이하여야 합니다" } },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "JPEG, PNG, WebP만 허용됩니다" } },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = image.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await image.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const imageUrl = `/uploads/${filename}`;

    const post = await prisma.post.create({
      data: { userId, imageUrl, caption: caption || null },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json(
      {
        post: {
          ...post,
          createdAt: post.createdAt.toISOString(),
          isLiked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}
