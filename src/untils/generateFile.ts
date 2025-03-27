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
  resumo?: NotaFiscalResumo | null; 
}


interface Item {
  cfop: string;
  valor: number;
  grupo: string;
  baseItem: number;
  icmsItem: number;
  notaFiscal: NotaFiscal;
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
}

export async function generateFile(): Promise<string> {
  try {
    // Busca os dados do banco de dados
    const itens: Item[] = await prisma.item.findMany({
      select: {
        cfop: true,
        valor: true,
        grupo: true,
        icmsItem: true,
        baseItem: true,
        notaFiscal: {
          select: {
            dataEntrada: true,
            numero: true,
            fornecedor: true,
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

    // Agrupar os itens por notaFiscal.numero e grupo
    const agrupados: Record<string, AgrupadoItem> = itens.reduce((acc, item) => {
      const chave = `${item.notaFiscal.numero}-${item.grupo}`;

      if (!acc[chave]) {
        acc[chave] = {
          dataEntrada: item.notaFiscal.dataEntrada,
          notaFiscal: item.notaFiscal.numero,
          cfop: item.cfop,
          fornecedor: item.notaFiscal.fornecedor,
          grupo: item.grupo,
          valorTotal: 0,
          baseCalculo: 0,
          aliquota: item.notaFiscal.resumo?.aliquota || 0,
          icmsDestacado: 0,
        };
      }

      acc[chave].valorTotal += Number(item.valor) / 100;
      acc[chave].baseCalculo += Number(item.baseItem) / 100;
      acc[chave].icmsDestacado += Number(item.icmsItem) / 100;
      return acc;
    }, {} as Record<string, AgrupadoItem>);

    // Criar um novo workbook e worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Notas Fiscais");

    // Definir os cabeçalhos
    worksheet.columns = [
      { header: "Data Entrada", key: "dataEntrada", width: 15 },
      { header: "Nota Fiscal", key: "notaFiscal", width: 20 },
      { header: "CFOP", key: "cfop", width: 15 },
      { header: "Fornecedor", key: "fornecedor", width: 40 },
      { header: "Grupo", key: "grupo", width: 15 },
      { header: "Valor Total", key: "valorTotal", width: 15 },
      { header: "Base de Cálculo", key: "baseCalculo", width: 15 },
      { header: "Alíquota", key: "aliquota", width: 15 },
      { header: "ICMS Destacado", key: "icmsDestacado", width: 30 },
    ];

    // Estilizar os cabeçalhos
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" }, // Cor de fundo verde
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" }, // Cor da fonte branca
        size: 12,
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Populando a planilha com os dados agrupados
    Object.values(agrupados).forEach((item) => {
      // Converte a string 'dataEntrada' para o formato 'dd/mm/yyyy'
      const dataString = item.dataEntrada;
      const dia = dataString.substring(0, 2);
      const mes = dataString.substring(2, 4);
      const ano = dataString.substring(4, 8);
      const dataFormatada = `${dia}/${mes}/${ano}`;

      const row = worksheet.addRow({
        dataEntrada: dataFormatada,
        notaFiscal: item.notaFiscal,
        cfop: item.cfop,
        fornecedor: item.fornecedor,
        grupo: item.grupo,
        valorTotal: item.valorTotal,
        baseCalculo: item.baseCalculo,
        aliquota: item.aliquota,
        icmsDestacado: item.icmsDestacado,
      });

      // Aplica formatação numérica brasileira
      row.getCell("valorTotal").numFmt = "#,##0.00";
      row.getCell("baseCalculo").numFmt = "#,##0.00";
      row.getCell("icmsDestacado").numFmt = "#,##0.00";
    });

    // Define um caminho temporário para salvar o arquivo
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, "Estorno.xlsx");

    // Salva o arquivo Excel
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  } catch (error) {
    console.error("Erro ao gerar o arquivo Excel:", error);
    throw new Error("Falha ao gerar o arquivo Excel.");
  }
}
