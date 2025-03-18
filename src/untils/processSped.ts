import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
    const produtos = []

    for (const line of lines) {
      const fields = line.split("|");

      //Lista os fornecedores
      if (fields[1] === "0150") {
        fornecedores.push({
          numero: fields[2],
          nome: fields[3],
        })
      }

      //lista os produtos
      if (fields[1] === "0200") {
        produtos.push({
          codigo: fields[2],
          ncm: fields[8],
          genero: fields[10]
        })
      }

      //Busca pelos registros C100 somente entrada
      if (fields[1] === "C100" && fields[2] === "0") {
        const fornecedorAtual = fornecedores.find(fornecedor => fornecedor.numero === fields[4])?.nome || "Desconhecido";
        c100Found++;


        // Converte corretamente para centavos
        const valorEmCentavos = parseFloat(fields[12].replace(',', '.')) * 100;


        // Cria a Nota Fiscal
        currentNota = await prisma.notaFiscal.create({
          data: {
            numero: fields[8],
            dataEntrada: fields[11],
            fornecedor: fornecedorAtual,
            valor: valorEmCentavos
          },
        });
      } else if (fields[1] === "C170" && currentNota) {

        if (currentNota === null) {
          throw new Error("Nota Fiscal não encontrada");
        }

        const codigoProduto = fields[3];

        // Busca o produto pelo código
        const produto = produtos.find(produto => produto.codigo === codigoProduto) || { ncm: "Desconhecido", genero: "Desconhecido" };
        const ncm = produto.ncm;
        let grupo = '';

        //Define o grupo pelo inicio do NCM
        if (ncm.startsWith("32") || ncm.startsWith("34") || ncm.startsWith("38") || ncm.startsWith("39")) {
          grupo = "Defensivos";
        } else if (ncm.startsWith("25") || ncm.startsWith("31")) {
          grupo = "Fertilizante";
        } else if (ncm.startsWith("10") || ncm.startsWith("12")) {
          grupo = "Fertilizantes";
        } else {
          grupo = "Outros"
        }

        // Converte corretamente para centavos
        const valorEmCentavos = parseFloat(fields[7].replace(',', '.')) * 100;

        // Criar os Itens da Nota Fiscal se o NCM for válido
        if (grupo !== '') {
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
              ncm
            },
          });
        }





      } else if (fields[1] === "C190" && currentNota) {
        if (currentNota === null) {
          throw new Error("Nota Fiscal não encontrada");
        }


        // Converte corretamente para centavos
        const baseCalculo = parseFloat(fields[6].replace(',', '.')) * 100;
        const icmsDestacado = parseFloat(fields[7].replace(',', '.')) * 100;

        let aliquota = parseFloat(fields[4]);


        // Verifica se os valores são válidos
        if (isNaN(aliquota)) {
          aliquota = 0;
        }

        // Remover qualquer resumo anterior da mesma nota antes de inserir o novo
        await prisma.resumoFiscal.deleteMany({
          where: { notaFiscalId: currentNota.id },
        });

        // Criar o novo resumo fiscal
        await prisma.resumoFiscal.create({
          data: {
            notaFiscalId: currentNota.id,
            baseCalculo,
            aliquota,
            icmsDestacado
          },
        });
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