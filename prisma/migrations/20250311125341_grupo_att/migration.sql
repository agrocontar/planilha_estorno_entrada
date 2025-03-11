/*
  Warnings:

  - You are about to drop the `GruposProduto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `grupoId` on the `Item` table. All the data in the column will be lost.
  - Added the required column `grupo` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GruposProduto";
PRAGMA foreign_keys=on;

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
    "grupo" TEXT NOT NULL,
    CONSTRAINT "Item_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("cfop", "codigoFiscal", "descricao", "id", "notaFiscalId", "quantidade", "unidade", "valor") SELECT "cfop", "codigoFiscal", "descricao", "id", "notaFiscalId", "quantidade", "unidade", "valor" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
