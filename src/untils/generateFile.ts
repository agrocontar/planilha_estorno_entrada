import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import ExcelJS from "exceljs";
import path from "path";
import os from "os";

// Definição dos tipos para os dados da nota fiscal
interface NotaFiscalResumo {
  baseCalculo: number;
  aliquota: number;
  icmsDestacado: number;
}

interface NotaFiscal {
  dataEntrada: string;
  numero: string;
  fornecedor: string;
  tipo: number; // 0 para entrada, 1 para saída
  resumo?: NotaFiscalResumo | null; 
}


interface Item {
  cfop: string;
  valor: number;
  grupo: string;
  baseItem: number;
  icmsItem: number;
  notaFiscal: NotaFiscal;
  quantidade: number;
  codMercadoria: string;
  aliquota: number;
}

interface AgrupadoItem {
  dataEntrada: string;
  notaFiscal: string;
  cfop: string;
  fornecedor: string;
  grupo: string;
  valorTotal: number;
  baseCalculo: number;
  aliquota: number;
  icmsDestacado: number;
  mercadoria: string;
  quantidade: number;
  tipo: number; // 0 para entrada, 1 para saída
}

export async function generateFile(tipoNota: 0 | 1): Promise<string> {
  try {
    // Busca os dados do banco de dados
    const itens: Item[] = await prisma.item.findMany({
      select: {
        cfop: true,
        valor: true,
        grupo: true,
        icmsItem: true,
        baseItem: true,
        quantidade: true,
        codMercadoria: true,
        aliquota: true,
        notaFiscal: {
          select: {
            dataEntrada: true,
            numero: true,
            fornecedor: true,
            tipo: true,
            resumo: {
              select: {
                baseCalculo: true,
                aliquota: true,
                icmsDestacado: true,
              },
            },
          },
        },
      },
    });

    if (itens.length === 0) {
      throw new Error("Nenhum dado disponível para exportação.");
    }

    // Criar um novo workbook e worksheet
    const workbook = new ExcelJS.Workbook();
    const nomePlanilha = tipoNota === 0 ? "Notas de Entrada" : "Notas de Saída";
    const worksheet = workbook.addWorksheet(nomePlanilha);

    worksheet.columns = tipoNota === 0
      ? [
          { header: "Data Entrada", key: "dataEntrada", width: 15 },
          { header: "Nota Fiscal", key: "notaFiscal", width: 20 },
          { header: "CFOP", key: "cfop", width: 15 },
          { header: "Fornecedor", key: "fornecedor", width: 40 },
          { header: "Grupo", key: "grupo", width: 15 },
          { header: "Valor Total", key: "valorTotal", width: 15 },
          { header: "Base de Cálculo", key: "baseCalculo", width: 15 },
          { header: "Alíquota", key: "aliquota", width: 15 },
          { header: "ICMS Destacado", key: "icmsDestacado", width: 30 },
        ]
      : [
          { header: "Data Entrada", key: "dataEntrada", width: 15 },
          { header: "Nota Fiscal", key: "notaFiscal", width: 20 },
          { header: "CFOP", key: "cfop", width: 15 },
          { header: "Fornecedor", key: "fornecedor", width: 40 },
          { header: "Grupo", key: "grupo", width: 15 },
          { header: "Valor Produto", key: "valorProduto", width: 15 },
          { header: "Mercadoria", key: "mercadoria", width: 15 },
          { header: "Quantidade", key: "quantidade", width: 15 },
        ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    if (tipoNota === 0) {

      itens.forEach( item => {
        if (item.notaFiscal.tipo !== tipoNota) return;

        const dataString = item.notaFiscal.dataEntrada;
        const dia = dataString.substring(0, 2);
        const mes = dataString.substring(2, 4);
        const ano = dataString.substring(4, 8);
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const row = worksheet.addRow({
          dataEntrada: dataFormatada,
          notaFiscal: item.notaFiscal.numero,
          cfop: item.cfop,
          fornecedor: item.notaFiscal.fornecedor,
          grupo: item.grupo,
          valorTotal: Number(item.valor) / 100,
          baseCalculo: Number(item.baseItem) / 100,
          aliquota: item.aliquota || 0,
          icmsDestacado: Number(item.icmsItem) / 100,
        });

        // Formatar valores
        row.getCell("valorTotal").numFmt = "#,##0.00";
        row.getCell("baseCalculo").numFmt = "#,##0.00";
        row.getCell("icmsDestacado").numFmt = "#,##0.00";

        // Centraliza a célula de dataEntrada (coluna A) e notaFiscal (coluna B)
        row.getCell("dataEntrada").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("notaFiscal").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("cfop").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("grupo").alignment = { horizontal: "center", vertical: "middle" };

        // Define a altura de todas as linhas (por exemplo, 25 de altura)
        worksheet.eachRow((row) => {
          row.height = 25;
        });

      })


    } else if(tipoNota === 1) {
      // Sem agrupamento para notas de saída
      itens.forEach((item) => {
        if (item.notaFiscal.tipo !== tipoNota) return;

        const dataString = item.notaFiscal.dataEntrada;
        const dia = dataString.substring(0, 2);
        const mes = dataString.substring(2, 4);
        const ano = dataString.substring(4, 8);
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const row = worksheet.addRow({
          dataEntrada: dataFormatada,
          notaFiscal: item.notaFiscal.numero,
          cfop: item.cfop,
          fornecedor: item.notaFiscal.fornecedor,
          grupo: item.grupo,
          valorProduto: Number(item.valor) / 100,
          mercadoria: item.codMercadoria,
          quantidade: item.quantidade,
        });

        // Formatar valores
        row.getCell("valorProduto").numFmt = "#,##0.00";

        // Centraliza a célula de dataEntrada (coluna A) e notaFiscal (coluna B)
        row.getCell("dataEntrada").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("notaFiscal").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("cfop").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("grupo").alignment = { horizontal: "center", vertical: "middle" };

        // Define a altura de todas as linhas (por exemplo, 25 de altura)
        worksheet.eachRow((row) => {
          row.height = 25;
        });
      });
    }

    // Salvar o arquivo temporário
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, "Estorno.xlsx");

    await workbook.xlsx.writeFile(filePath);

    return filePath;
  } catch (error) {
    console.error("Erro ao gerar o arquivo Excel:", error);
    throw new Error("Falha ao gerar o arquivo Excel.");
  }
}
