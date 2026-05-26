-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalSaved" INTEGER NOT NULL DEFAULT 0,
    "avatar" TEXT NOT NULL
);
INSERT INTO "new_Child" ("id", "name", "className", "accountNumber", "points", "totalSaved", "avatar")
SELECT "id", "name", "className", 'HB-2024-' || substr(hex(randomblob(2)), 1, 4), "points", "totalSaved", "avatar" FROM "Child";
DROP TABLE "Child";
ALTER TABLE "new_Child" RENAME TO "Child";
CREATE UNIQUE INDEX "Child_accountNumber_key" ON "Child"("accountNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
