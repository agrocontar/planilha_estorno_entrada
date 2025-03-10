-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotaFiscal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "dataEntrada" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL
);
INSERT INTO "new_NotaFiscal" ("dataEntrada", "fornecedor", "id", "numero", "valor") SELECT "dataEntrada", "fornecedor", "id", "numero", "valor" FROM "NotaFiscal";
DROP TABLE "NotaFiscal";
ALTER TABLE "new_NotaFiscal" RENAME TO "NotaFiscal";
CREATE UNIQUE INDEX "NotaFiscal_numero_key" ON "NotaFiscal"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
