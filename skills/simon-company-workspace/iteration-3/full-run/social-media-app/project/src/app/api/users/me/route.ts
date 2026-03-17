import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { profileUpdateSchema } from "@/lib/validations";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PUT(request: Request) {
  try {
    const userId = await requireAuth();
    const formData = await request.formData();

    const displayName = formData.get("displayName") as string | null;
    const bio = formData.get("bio") as string | null;
    const avatar = formData.get("avatar") as File | null;

    const parsed = profileUpdateSchema.safeParse({
      displayName: displayName || undefined,
      bio: bio || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    let avatarUrl: string | undefined;

    if (avatar && avatar.size > 0) {
      if (avatar.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "이미지 크기는 5MB 이하여야 합니다" } },
          { status: 400 }
        );
      }

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadsDir, { recursive: true });

      const ext = avatar.name.split(".").pop() || "jpg";
      const filename = `${userId}-${Date.now()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      const bytes = await avatar.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));

      avatarUrl = `/uploads/avatars/${filename}`;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== null ? { displayName } : {}),
        ...(bio !== null ? { bio } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    return NextResponse.json({
      user: { ...user, isFollowing: false },
    });
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
