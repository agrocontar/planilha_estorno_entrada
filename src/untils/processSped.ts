import { prisma } from "@/lib/prisma";
import fs from "fs/promises";

export async function processSpedFile(filePath: string) {
  try {
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
    const fornecedores = []

    for (const line of lines) {
      const fields = line.split("|");

      //Lista os fornecedores
      if(fields[1] === "0150"){
          fornecedores.push({
            numero: fields[2],
            nome: fields[3],
          })
      }

      //Busca pelos registros C100 somente entrada
      if (fields[1] === "C100" && fields[2] === "0") {
        const fornecedorAtual = fornecedores.find(fornecedor => fornecedor.numero === fields[4])?.nome || "Desconhecido";
        c100Found++;


        // Cria a Nota Fiscal
        currentNota = await prisma.notaFiscal.create({
          data: {
            numero: fields[8],
            dataEntrada: fields[11],
            fornecedor: fornecedorAtual,
            valor: parseFloat(fields[12]),
          },
        });
      } else if (fields[1] === "C170" && currentNota) {

        if(currentNota === null){
          throw new Error("Nota Fiscal não encontrada");
        }
        // Criar os Itens da Nota Fiscal
        await prisma.item.create({
          data: {
            notaFiscalId: currentNota.id,
            descricao: fields[4],
            quantidade: parseFloat(fields[5]),
            unidade: fields[6],
            valor: parseFloat(fields[7]),
            cfop: fields[11],
          },
        });
      } else if (fields[1] === "C190" && currentNota) {
        if(currentNota === null){
          throw new Error("Nota Fiscal não encontrada");
        }
        // Verifica se já existe um resumo para essa nota
          const existingResumo = await prisma.resumoFiscal.findFirst({
            where: { notaFiscalId: currentNota.id }
        });

        if (!existingResumo) {
            await prisma.resumoFiscal.create({
                data: {
                    notaFiscalId: currentNota.id,
                    baseCalculo: parseFloat(fields[5]),
                    aliquota: parseFloat(fields[4]),
                    icmsDestacado: parseFloat(fields[6]),
                },
            });
        }
      }
    }

    if (c100Found < 2) {
      throw new Error("Registro C100 inválido: nota fiscal incompleta.");
    }

    return { message: "Arquivo processado e salvo no banco de dados!" };
  } catch (error) {
    console.error("Erro ao processar o SPED:", error);
    throw new Error("Falha ao processar o arquivo SPED.");
  }
}
