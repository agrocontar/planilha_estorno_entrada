-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "dataEntrada" DATETIME NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notaFiscalId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "cfop" TEXT NOT NULL,
    CONSTRAINT "Item_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumoFiscal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notaFiscalId" INTEGER NOT NULL,
    "baseCalculo" DECIMAL NOT NULL,
    "aliquota" DECIMAL NOT NULL,
    "icmsDestacado" DECIMAL NOT NULL,
    CONSTRAINT "ResumoFiscal_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_numero_key" ON "NotaFiscal"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ResumoFiscal_notaFiscalId_key" ON "ResumoFiscal"("notaFiscalId");
