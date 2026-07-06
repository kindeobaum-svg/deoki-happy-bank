-- CreateTable
CREATE TABLE "PassbookTransaction" (
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

-- CreateTable
CREATE TABLE "MissionCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissionCompletion_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiaryDeposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "reportDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiaryDeposit_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PassbookTransaction_childId_createdAt_idx" ON "PassbookTransaction"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "PassbookTransaction_childId_date_idx" ON "PassbookTransaction"("childId", "date");

-- CreateIndex
CREATE INDEX "MissionCompletion_childId_date_idx" ON "MissionCompletion"("childId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MissionCompletion_childId_missionId_date_key" ON "MissionCompletion"("childId", "missionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DiaryDeposit_childId_reportDate_key" ON "DiaryDeposit"("childId", "reportDate");

-- Migrate existing SaveRecord rows into PassbookTransaction
INSERT INTO "PassbookTransaction" ("id", "childId", "type", "item", "amount", "balance", "date", "createdAt")
SELECT
    sr."id",
    sr."childId",
    'DEPOSIT',
    sr."message",
    sr."amount",
    (
        SELECT COALESCE(SUM(sr2."amount"), 0)
        FROM "SaveRecord" sr2
        WHERE sr2."childId" = sr."childId"
          AND (sr2."createdAt" < sr."createdAt" OR (sr2."createdAt" = sr."createdAt" AND sr2."id" <= sr."id"))
    ),
    date(sr."createdAt"),
    sr."createdAt"
FROM "SaveRecord" sr
ORDER BY sr."childId", sr."createdAt", sr."id";
