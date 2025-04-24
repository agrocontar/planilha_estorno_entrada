/*
  Warnings:

  - You are about to alter the column `quantidade` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - Added the required column `codMercadoria` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `NotaFiscal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notaFiscalId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "cfop" TEXT NOT NULL,
    "codigoProduto" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "icmsItem" REAL NOT NULL,
    "baseItem" REAL NOT NULL,
    "codMercadoria" TEXT NOT NULL,
    CONSTRAINT "Item_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("baseItem", "cfop", "codigoProduto", "descricao", "grupo", "icmsItem", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor") SELECT "baseItem", "cfop", "codigoProduto", "descricao", "grupo", "icmsItem", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_NotaFiscal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "dataEntrada" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" INTEGER NOT NULL
);
INSERT INTO "new_NotaFiscal" ("dataEntrada", "fornecedor", "id", "numero", "valor") SELECT "dataEntrada", "fornecedor", "id", "numero", "valor" FROM "NotaFiscal";
DROP TABLE "NotaFiscal";
ALTER TABLE "new_NotaFiscal" RENAME TO "NotaFiscal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
