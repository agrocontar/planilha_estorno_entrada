import { prisma } from "@/lib/prisma";
import fs from "fs/promises";

export async function processSpedFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    let currentNota = null;

    for (const line of lines) {
      const fields = line.split("|");

      if (fields[1] === "C100") {
        // Verificar se a data está no formato DDMMYYYY
        const dataEntrada = fields[11]; 
        if (dataEntrada.length === 8) {
          // Formatar a data para o formato YYYY-MM-DD
          const formattedDate = `20${dataEntrada.slice(4, 8)}-${dataEntrada.slice(2, 4)}-${dataEntrada.slice(0, 2)}`;
          
          // Garantir que a data seja válida
          const validDate = new Date(formattedDate);
          if (validDate instanceof Date && !isNaN(validDate.getTime())) {
            currentNota = await prisma.notaFiscal.create({
              data: {
                numero: fields[9],
                dataEntrada: validDate, // Passando a data válida
                fornecedor: fields[8], // Pode ser ajustado conforme necessidade
                valor: parseFloat(fields[12]),
              },
            });
          } else {
            console.error("Data inválida:", formattedDate);
          }
        } else {
          console.error("Data de entrada inválida:", dataEntrada);
        }
      } else if (fields[1] === "C170" && currentNota) {
        // Criar os Itens da Nota Fiscal
        await prisma.item.create({
          data: {
            notaFiscalId: currentNota.id,
            descricao: fields[4],
            quantidade: parseFloat(fields[5]),
            unidade: fields[6],
            valor: parseFloat(fields[7]),
            cfop: fields[10],
          },
        });
      } else if (fields[1] === "C190" && currentNota) {
        // Criar o Resumo Fiscal
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

    return { message: "Arquivo processado e salvo no banco de dados!" };
  } catch (error) {
    console.error("Erro ao processar o SPED:", error);
    throw new Error("Falha ao processar o arquivo SPED.");
  }
}
