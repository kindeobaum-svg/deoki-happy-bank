import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

let ensured = false;

/** 로그인 데모 계정이 없을 때 최소 시드 (Vercel 빈 Turso/SQLite 대응) */
export async function ensureDemoUsers(): Promise<void> {
  if (ensured) return;

  const count = await prisma.user.count();
  if (count > 0) {
    ensured = true;
    return;
  }

  console.log("[auth] seeding demo users (database was empty)");
  const passwordHash = await bcrypt.hash("1234", 10);

  const child = await prisma.child.create({
    data: {
      name: "김하늘",
      className: "햇살반",
      accountNumber: "HB-2024-0001",
      points: 0,
      totalSaved: 0,
      avatar: "🌻",
    },
  });

  await prisma.user.createMany({
    data: [
      {
        email: "director@haengbok.local",
        passwordHash,
        name: "원장 선생님",
        role: "DIRECTOR",
      },
      {
        email: "teacher@haengbok.local",
        passwordHash,
        name: "담임 선생님",
        role: "TEACHER",
      },
      {
        email: "parent@haengbok.local",
        passwordHash,
        name: "김하늘 학부모",
        role: "PARENT",
        childId: child.id,
      },
      {
        email: "child@haengbok.local",
        passwordHash,
        name: "김하늘",
        role: "CHILD",
        childId: child.id,
      },
    ],
  });

  ensured = true;
  console.log("[auth] demo users ready");
}
