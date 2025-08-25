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
    "aliquota" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Item_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("baseItem", "cfop", "codMercadoria", "codigoProduto", "descricao", "grupo", "icmsItem", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor") SELECT "baseItem", "cfop", "codMercadoria", "codigoProduto", "descricao", "grupo", "icmsItem", "id", "ncm", "notaFiscalId", "quantidade", "unidade", "valor" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
