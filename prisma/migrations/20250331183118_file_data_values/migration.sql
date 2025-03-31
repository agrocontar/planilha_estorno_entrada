/*
  Warnings:

  - Added the required column `cnpj` to the `FileData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fisrtDate` to the `FileData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastDate` to the `FileData` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FileData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "fisrtDate" TEXT NOT NULL,
    "lastDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_FileData" ("content", "createdAt", "id") SELECT "content", "createdAt", "id" FROM "FileData";
DROP TABLE "FileData";
ALTER TABLE "new_FileData" RENAME TO "FileData";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
