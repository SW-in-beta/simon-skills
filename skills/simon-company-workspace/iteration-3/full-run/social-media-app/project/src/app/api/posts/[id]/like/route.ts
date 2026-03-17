import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "게시물을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: { code: "ALREADY_LIKED", message: "이미 좋아요한 게시물입니다" } },
        { status: 400 }
      );
    }

    await prisma.like.create({ data: { userId, postId } });

    if (post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          actorId: userId,
          type: "LIKE",
          postId,
        },
      });
    }

    const likeCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json({ liked: true, likeCount });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id: postId } = await params;

    await prisma.like.deleteMany({ where: { userId, postId } });

    const likeCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json({ liked: false, likeCount });
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
