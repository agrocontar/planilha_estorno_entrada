import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";

async function acquireLock() {
  while (true) {
    const existingLock = await prisma.processingLock.findFirst();
    if (!existingLock) {
      await prisma.processingLock.create({ data: {} });
      return;
    }
    console.log("Outro processamento em andamento. Aguardando...");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Espera 3s antes de tentar novamente
  }
}

async function releaseLock() {
  await prisma.processingLock.deleteMany(); // Remove todos os locks
}

export async function processSpedFile(filePath: string) {
  try {
    await acquireLock(); // Aguarda a liberação e adquire o lock

    console.log("Iniciando processamento...");

    // Limpa os dados antes de processar o novo arquivo
    await prisma.resumoFiscal.deleteMany({});
    await prisma.item.deleteMany({});
    await prisma.notaFiscal.deleteMany({});

    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    let c100Found = 0;

    if (lines.length === 0) {
      throw new Error("Arquivo SPED está vazio ou não segue o formato esperado.");
    }

    let currentNota = null;
    const fornecedores = [];
    const produtos = [];

    for (const line of lines) {
      const fields = line.split("|");

      if (fields[1] === "0150") {
        fornecedores.push({
          numero: fields[2],
          nome: fields[3],
        });
      }

      if (fields[1] === "0200") {
        produtos.push({
          codigo: fields[2],
          ncm: fields[8],
          genero: fields[10],
        });
      }

      if (fields[1] === "C100" && fields[2] === "0" && (fields[6] === "00" || fields[6] === "01")) {
        const fornecedorAtual =
          fornecedores.find((fornecedor) => fornecedor.numero === fields[4])?.nome ||
          "Desconhecido";
        c100Found++;

        const valorEmCentavos = parseFloat(fields[12].replace(",", ".")) * 100;

        currentNota = await prisma.notaFiscal.create({
          data: {
            numero: fields[8],
            dataEntrada: fields[11],
            fornecedor: fornecedorAtual,
            valor: valorEmCentavos,
          },
        });
      } else if (fields[1] === "C170" && currentNota) {
        if (currentNota === null) {
          throw new Error("Nota Fiscal não encontrada");
        }

        const codigoProduto = fields[3];

        const produto =
          produtos.find((produto) => produto.codigo === codigoProduto) || {
            ncm: "Desconhecido",
            genero: "Desconhecido",
          };
        const ncm = produto.ncm;
        let grupo = "";

        if (ncm.startsWith("32") || ncm.startsWith("34") || ncm.startsWith("38") || ncm.startsWith("39")) {
          grupo = "Defensivos";
        } else if (ncm.startsWith("25") || ncm.startsWith("31")) {
          grupo = "Fertilizante";
        } else if (ncm.startsWith("10") || ncm.startsWith("12")) {
          grupo = "Semente";
        } else {
          grupo = "Outros";
        }

        const valorEmCentavos = parseFloat(fields[7].replace(",", ".")) * 100;

        if (grupo !== "") {
          await prisma.item.create({
            data: {
              notaFiscalId: currentNota.id,
              descricao: fields[4],
              quantidade: parseFloat(fields[5]),
              unidade: fields[6],
              valor: valorEmCentavos,
              cfop: fields[11],
              codigoProduto: parseInt(fields[3]),
              grupo,
              ncm,
            },
          });
        }
      } else if (fields[1] === "C190" && currentNota) {
        if (currentNota === null) {
          throw new Error("Nota Fiscal não encontrada");
        }

        const baseCalculo = parseFloat(fields[6].replace(",", ".")) * 100;
        const icmsDestacado = parseFloat(fields[7].replace(",", ".")) * 100;

        let aliquota = parseFloat(fields[4]);

        if (isNaN(aliquota)) {
          aliquota = 0;
        }

        await prisma.resumoFiscal.deleteMany({
          where: { notaFiscalId: currentNota.id },
        });

        await prisma.resumoFiscal.create({
          data: {
            notaFiscalId: currentNota.id,
            baseCalculo,
            aliquota,
            icmsDestacado,
          },
        });
      }
    }

    console.log("Processamento finalizado!");
    return { message: "Arquivo processado e salvo no banco de dados!" };
  } catch (error) {
    console.error("Erro ao processar o SPED:", error);
    throw new Error("Falha ao processar o arquivo SPED.");
  } finally {
    await releaseLock(); // Libera a fila após o processamento
  }
}