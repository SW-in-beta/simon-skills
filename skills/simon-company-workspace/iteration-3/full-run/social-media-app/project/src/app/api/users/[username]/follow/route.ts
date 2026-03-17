import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUserId = await requireAuth();
    const { username } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    if (targetUser.id === currentUserId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "자기 자신을 팔로우할 수 없습니다" } },
        { status: 400 }
      );
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ following: true });
    }

    await prisma.follow.create({
      data: { followerId: currentUserId, followingId: targetUser.id },
    });

    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        actorId: currentUserId,
        type: "FOLLOW",
      },
    });

    return NextResponse.json({ following: true });
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
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUserId = await requireAuth();
    const { username } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    await prisma.follow.deleteMany({
      where: { followerId: currentUserId, followingId: targetUser.id },
    });

    return NextResponse.json({ following: false });
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
