/*
  Warnings:

  - Added the required column `codigoFiscal` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grupoId` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GruposProduto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notaFiscalId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "cfop" TEXT NOT NULL,
    "codigoFiscal" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    CONSTRAINT "Item_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GruposProduto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("cfop", "descricao", "id", "notaFiscalId", "quantidade", "unidade", "valor") SELECT "cfop", "descricao", "id", "notaFiscalId", "quantidade", "unidade", "valor" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
