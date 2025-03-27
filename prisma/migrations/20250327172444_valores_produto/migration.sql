/*
  Warnings:

  - Added the required column `baseItem` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icmsItem` to the `Item` table without a default value. This is not possible if the table is not empty.

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
    "valor" REAL NOT NULL,
    "cfop" TEXT NOT NULL,
    "codigoProduto" REAL NOT NULL,
    "grupo" TEXT NOT NULL,
    "ncm" TEXT NOT NULL,
    "icmsItem" REAL NOT NULL,
    "baseItem" REAL NOT NULL,
    CONSTRAINT "Item_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("cfop", "codigoProduto", "descricao", "grupo", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor") SELECT "cfop", "codigoProduto", "descricao", "grupo", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
