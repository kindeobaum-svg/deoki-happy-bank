import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

export async function seedDatabase(options: { force?: boolean } = {}) {
  const force = options.force ?? process.env.SEED_FORCE === "1";
  const userCount = await prisma.user.count();

  if (!force && userCount > 0) {
    console.log("Seed skipped — database already has data.");
    return;
  }

  if (force) {
    await prisma.diaryDeposit.deleteMany();
    await prisma.missionCompletion.deleteMany();
    await prisma.passbookTransaction.deleteMany();
    await prisma.inviteCode.deleteMany();
    await prisma.pushSubscription.deleteMany();
    await prisma.praiseRecord.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.saveRecord.deleteMany();
    await prisma.dailyReport.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.user.deleteMany();
    await prisma.child.deleteMany();
  }

  const passwordHash = await bcrypt.hash("1234", 10);

  const child1 = await prisma.child.create({
    data: {
      name: "김하늘",
      className: "햇살반",
      accountNumber: "HB-2024-0001",
      points: 1,
      totalSaved: 100,
      avatar: "🌻",
    },
  });

  const child2 = await prisma.child.create({
    data: {
      name: "이민준",
      className: "햇살반",
      accountNumber: "HB-2024-0002",
      points: 2,
      totalSaved: 200,
      avatar: "🐻",
    },
  });

  const child3 = await prisma.child.create({
    data: {
      name: "박서연",
      className: "무지개반",
      accountNumber: "HB-2024-0003",
      points: 1,
      totalSaved: 100,
      avatar: "🦋",
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
        childId: child1.id,
      },
      {
        email: "child@haengbok.local",
        passwordHash,
        name: "김하늘",
        role: "CHILD",
        childId: child1.id,
      },
    ],
  });

  await prisma.passbookTransaction.createMany({
    data: [
      {
        childId: child1.id,
        type: "DEPOSIT",
        item: "첫 적립 — 오늘도 잘했어요!",
        amount: 100,
        balance: 100,
        date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
        createdAt: new Date(Date.now() - 172800000),
      },
      {
        childId: child2.id,
        type: "DEPOSIT",
        item: "친구와 나누기 잘했어요!",
        amount: 100,
        balance: 100,
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        childId: child2.id,
        type: "DEPOSIT",
        item: "스스로 정리했어요!",
        amount: 100,
        balance: 200,
        date: new Date(Date.now() - 43200000).toISOString().slice(0, 10),
        createdAt: new Date(Date.now() - 43200000),
      },
      {
        childId: child3.id,
        type: "DEPOSIT",
        item: "스스로 정리정돈했어요!",
        amount: 100,
        balance: 100,
        date: new Date(Date.now() - 3600000).toISOString().slice(0, 10),
        createdAt: new Date(Date.now() - 3600000),
      },
    ],
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: "행복부자 프로젝트 시작!",
        content:
          "아이들이 스스로 적립하기 버튼을 누르며 나무를 키워요. 작은 습관이 큰 행복의 씨앗이 됩니다.",
        author: "원장 선생님",
      },
      {
        title: "이번 주 행복 미션",
        content: "감사한 마음 표현하기, 친구와 장난감 나누기, 스스로 옷 정리하기",
        author: "햇살반 담임",
        createdAt: new Date(Date.now() - 172800000),
      },
    ],
  });

  await prisma.dailyReport.create({
    data: {
      childId: child1.id,
      date: new Date().toISOString().slice(0, 10),
      mood: "😊",
      meal: "밥 잘 먹었어요",
      nap: "1시간 30분",
      note: "친구들과 블록 놀이를 즐겁게 했어요.",
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  await prisma.attendance.createMany({
    data: [
      { childId: child1.id, date: today, status: "PRESENT" },
      { childId: child2.id, date: today, status: "LATE" },
      { childId: child3.id, date: today, status: "PRESENT" },
    ],
  });

  await prisma.praiseRecord.createMany({
    data: [
      {
        childId: child1.id,
        message: "친구에게 먼저 인사했어요!",
        emoji: "😊",
        author: "담임 선생님",
        date: today,
      },
      {
        childId: child2.id,
        message: "블록을 스스로 정리했어요!",
        emoji: "🧹",
        author: "담임 선생님",
        date: today,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password: 1234):");
  console.log("  director@haengbok.local (원장)");
  console.log("  teacher@haengbok.local (교사)");
  console.log("  parent@haengbok.local (학부모)");
  console.log("  child@haengbok.local (원아)");
}

async function main() {
  await seedDatabase({ force: process.env.SEED_FORCE === "1" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
