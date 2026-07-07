/** Vercel serverless 번들용 — prisma/migrations 파일이 없을 때 폴백 */
export const EMBEDDED_TURSO_MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: "20260524104925_init",
    sql: `CREATE TABLE IF NOT EXISTS "Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalSaved" INTEGER NOT NULL DEFAULT 0,
    "avatar" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "childId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SaveRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaveRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "meal" TEXT NOT NULL,
    "nap" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    CONSTRAINT "DailyReport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Child_accountNumber_key" ON "Child"("accountNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyReport_childId_date_key" ON "DailyReport"("childId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_userId_endpoint_key" ON "PushSubscription"("userId", "endpoint");`,
  },
  {
    name: "20260524120000_add_director_and_passbook",
    sql: `SELECT 1;`,
  },
  {
    name: "20260524130000_attendance_praise",
    sql: `CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "Attendance_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PraiseRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '⭐',
    "author" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PraiseRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_childId_date_key" ON "Attendance"("childId", "date");`,
  },
  {
    name: "20260706120000_passbook_persistence",
    sql: `CREATE TABLE IF NOT EXISTS "PassbookTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PassbookTransaction_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "MissionCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissionCompletion_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DiaryDeposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "reportDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiaryDeposit_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PassbookTransaction_childId_createdAt_idx" ON "PassbookTransaction"("childId", "createdAt");
CREATE INDEX IF NOT EXISTS "PassbookTransaction_childId_date_idx" ON "PassbookTransaction"("childId", "date");
CREATE INDEX IF NOT EXISTS "MissionCompletion_childId_date_idx" ON "MissionCompletion"("childId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "MissionCompletion_childId_missionId_date_key" ON "MissionCompletion"("childId", "missionId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "DiaryDeposit_childId_reportDate_key" ON "DiaryDeposit"("childId", "reportDate");`,
  },
  {
    name: "20260703130000_invite_codes",
    sql: `CREATE TABLE IF NOT EXISTS "InviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "childId" TEXT,
    "createdById" TEXT NOT NULL,
    "usedAt" DATETIME,
    "usedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteCode_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InviteCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "InviteCode_code_key" ON "InviteCode"("code");
CREATE INDEX IF NOT EXISTS "InviteCode_childId_idx" ON "InviteCode"("childId");
CREATE INDEX IF NOT EXISTS "InviteCode_createdById_idx" ON "InviteCode"("createdById");`,
  },
  {
    name: "20260706180000_class_rooms",
    sql: `CREATE TABLE IF NOT EXISTS "ClassRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClassRoom_name_key" ON "ClassRoom"("name");`,
  },
];
