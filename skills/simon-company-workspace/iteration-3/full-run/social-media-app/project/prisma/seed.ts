import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      username: "alice",
      passwordHash,
      displayName: "Alice Kim",
      bio: "사진 찍는 것을 좋아합니다",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      username: "bob",
      passwordHash,
      displayName: "Bob Lee",
      bio: "여행과 음식을 좋아하는 개발자",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      email: "charlie@example.com",
      username: "charlie",
      passwordHash,
      displayName: "Charlie Park",
      bio: "일상을 기록합니다",
    },
  });

  // Alice follows Bob and Charlie
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    update: {},
    create: { followerId: alice.id, followingId: bob.id },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: alice.id, followingId: charlie.id } },
    update: {},
    create: { followerId: alice.id, followingId: charlie.id },
  });

  // Bob follows Alice
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: bob.id, followingId: alice.id } },
    update: {},
    create: { followerId: bob.id, followingId: alice.id },
  });

  console.log("Seed completed:", { alice: alice.id, bob: bob.id, charlie: charlie.id });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
