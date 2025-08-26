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

export async function processSpedFile(filePath: string, tipoNotaSelecionado: "0" | "1") {
  try {
    await acquireLock(); // Aguarda a liberação e adquire o lock

    console.log("Iniciando processamento...");

    // Limpa os dados antes de processar o novo arquivo
    await prisma.resumoFiscal.deleteMany({});
    await prisma.item.deleteMany({});
    await prisma.notaFiscal.deleteMany({});
    await prisma.fileData.deleteMany({});

    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    let c100Found = 0;

    if (lines.length === 0) {
      throw new Error("Arquivo SPED está vazio ou não segue o formato esperado.");
    }

    let currentNota = null;
    const fornecedores = [];
    const produtos = [];

    let currentTipoNota = null; // 0 para entrada, 1 para saída
    let temC170 = false;

    for (const line of lines) {
      const fields = line.split("|");

      if (fields[1] === "0000") {
        await prisma.fileData.create({
          data: {
            fisrtDate: fields[4] || "unknown",
            lastDate: fields[5] || "unknown",
            cnpj: fields[7] || "unknown",
            content: content,
          },
        });
      }

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

      if (
        fields[1] === "C100" &&
        ((tipoNotaSelecionado === "0" && fields[2] === "0") ||
          (tipoNotaSelecionado === "1" && fields[2] === "1")) &&
        ["00", "01", "06", "07", "08"].includes(fields[6])
      ) {

        // Se já havia uma nota em aberto, verifica se tinha C170
        if (currentNota) {
            if (!temC170) {
              // Remove nota de saída sem C170
              await prisma.item.deleteMany({ where: { notaFiscalId: currentNota.id } });
              await prisma.notaFiscal.delete({ where: { id: currentNota.id } });
            }
        }


        const fornecedorAtual = fornecedores.find(f => f.numero === fields[4])?.nome || "Desconhecido";
        const valorEmCentavos = parseFloat(fields[12].replace(",", ".")) * 100;

        currentNota = await prisma.notaFiscal.create({
          data: {
            numero: fields[8],
            dataEntrada: fields[11],
            fornecedor: fornecedorAtual,
            valor: valorEmCentavos,
            tipo: tipoNotaSelecionado === "0" ? 0 : 1, // 0 para entrada, 1 para saída
          },
        });

        currentTipoNota = tipoNotaSelecionado === "0" ? 0 : 1; // Entrada
        temC170 = false;
      }

      if (fields[1] === "C170" && currentNota !== null) {
        temC170 = true;

        const codigoProduto = fields[3];
        const produto = produtos.find(p => p.codigo === codigoProduto) || {
          ncm: "Desconhecido",
          genero: "Desconhecido",
        };
        const ncm = produto.ncm;
        let grupo = "";

        if (ncm.startsWith("38249977")) grupo = "Fertilizante";
        else if (ncm.startsWith("38")) grupo = "Defensivos";
        else if (ncm.startsWith("25") || ncm.startsWith("31")) grupo = "Fertilizante";
        else if (ncm.startsWith("10") || ncm.startsWith("12")) grupo = "Semente";
        else if (ncm.startsWith("3002")) grupo = "Inoculante";
        else grupo = "Outros";

        const valorEmCentavos = parseFloat(fields[7].replace(",", ".")) * 100;
        const ICMSEmCentavos = parseFloat(fields[15].replace(",", ".")) * 100;
        const BaseEmCentavos = parseFloat(fields[13].replace(",", ".")) * 100;
        const aliquota = parseFloat(fields[14]);
        
        if (grupo !== "") {
          await prisma.item.create({
            data: {
              notaFiscalId: currentNota.id,
              descricao: fields[4],
              quantidade: parseFloat(fields[5]),
              unidade: fields[6],
              valor: valorEmCentavos,
              cfop: fields[11],
              codigoProduto: fields[3],
              grupo,
              ncm,
              icmsItem: ICMSEmCentavos,
              baseItem: BaseEmCentavos,
              codMercadoria: codigoProduto,
              aliquota: isNaN(aliquota) ? 0 : aliquota,
            },
          });
        }
      }

      if (fields[1] === "C190" && currentNota && currentTipoNota === 0) {
        if (!temC170) {
          // Encontrou resumo fiscal antes de C170 → descarta nota
          await prisma.item.deleteMany({ where: { notaFiscalId: currentNota.id } });
          await prisma.resumoFiscal.deleteMany({ where: { notaFiscalId: currentNota.id } });
          await prisma.notaFiscal.delete({ where: { id: currentNota.id } });
          currentNota = null;
          temC170 = false;
          continue; // ignora este C190
        }

        const baseCalculo = parseFloat(fields[6].replace(",", ".")) * 100;
        const icmsDestacado = parseFloat(fields[7].replace(",", ".")) * 100;
        let aliquota = parseFloat(fields[4]);

        if (isNaN(aliquota)) aliquota = 0;

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

    if (currentNota && currentTipoNota === 1 && !temC170) {
      await prisma.item.deleteMany({ where: { notaFiscalId: currentNota.id } });
      await prisma.notaFiscal.delete({ where: { id: currentNota.id } });
    }

    console.log("Processamento finalizado!");
    return { message: "Arquivo processado e salvo no banco de dados!" };
  } catch (error) {
    console.error("Erro ao processar o SPED:", error);
    return error; // Retorna o erro para o chamador

  } finally {
    await releaseLock(); // Libera a fila após o processamento
  }
}