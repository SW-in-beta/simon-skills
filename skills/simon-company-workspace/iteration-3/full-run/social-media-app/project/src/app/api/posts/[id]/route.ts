import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUserId } from "@/lib/auth-utils";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();

    const post = await prisma.post.findUnique({
      where: { id },
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

    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "게시물을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      post: {
        id: post.id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        _count: post._count,
        isLiked: userId ? (post as unknown as { likes: { id: string }[] }).likes?.length > 0 : false,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true, imageUrl: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "게시물을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    if (post.userId !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "삭제 권한이 없습니다" } },
        { status: 403 }
      );
    }

    await prisma.post.delete({ where: { id } });

    try {
      const filepath = path.join(process.cwd(), "public", post.imageUrl);
      await unlink(filepath);
    } catch {
      // ignore file deletion errors
    }

    return NextResponse.json({ success: true });
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
