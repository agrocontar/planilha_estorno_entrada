/*
  Warnings:

  - You are about to alter the column `aliquota` on the `ResumoFiscal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `baseCalculo` on the `ResumoFiscal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `icmsDestacado` on the `ResumoFiscal` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResumoFiscal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notaFiscalId" INTEGER NOT NULL,
    "baseCalculo" INTEGER NOT NULL,
    "aliquota" INTEGER NOT NULL,
    "icmsDestacado" INTEGER NOT NULL,
    CONSTRAINT "ResumoFiscal_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ResumoFiscal" ("aliquota", "baseCalculo", "icmsDestacado", "id", "notaFiscalId") SELECT "aliquota", "baseCalculo", "icmsDestacado", "id", "notaFiscalId" FROM "ResumoFiscal";
DROP TABLE "ResumoFiscal";
ALTER TABLE "new_ResumoFiscal" RENAME TO "ResumoFiscal";
CREATE UNIQUE INDEX "ResumoFiscal_notaFiscalId_key" ON "ResumoFiscal"("notaFiscalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
