/*
  Warnings:

  - You are about to alter the column `valor` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.
  - You are about to alter the column `valor` on the `NotaFiscal` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.
  - You are about to alter the column `aliquota` on the `ResumoFiscal` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.
  - You are about to alter the column `baseCalculo` on the `ResumoFiscal` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.
  - You are about to alter the column `icmsDestacado` on the `ResumoFiscal` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notaFiscalId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "cfop" TEXT NOT NULL,
    "codigoProduto" INTEGER NOT NULL,
    "grupo" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    CONSTRAINT "Item_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("cfop", "codigoProduto", "descricao", "grupo", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor") SELECT "cfop", "codigoProduto", "descricao", "grupo", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_NotaFiscal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "dataEntrada" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" INTEGER NOT NULL
);
INSERT INTO "new_NotaFiscal" ("dataEntrada", "fornecedor", "id", "numero", "valor") SELECT "dataEntrada", "fornecedor", "id", "numero", "valor" FROM "NotaFiscal";
DROP TABLE "NotaFiscal";
ALTER TABLE "new_NotaFiscal" RENAME TO "NotaFiscal";
CREATE UNIQUE INDEX "NotaFiscal_numero_key" ON "NotaFiscal"("numero");
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
