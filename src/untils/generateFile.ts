import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import ExcelJS from "exceljs";
import path from "path";
import os from "os";

export async function generateFile() {
  try {
    // Busca os dados do banco de dados
    const itens = await prisma.item.findMany({
      select: {
        cfop: true,
        valor: true,
        grupo: true,
        notaFiscal: {
          select: {
            dataEntrada: true,
            numero: true,
            fornecedor: true,
            resumo: {
              select: {
                baseCalculo: true,
                aliquota: true,
                icmsDestacado: true
              }
            }
          }
        }
      }
    });
  
    

    if (itens.length === 0) {
      throw new Error("Nenhum dado disponível para exportação.");
    }

    // Cria um novo workbook e uma worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Notas Fiscais");

    // Define os cabeçalhos
    worksheet.columns = [
      { header: "Data Entrada", key: "dataEntrada", width: 15 },
      { header: "Nota Fiscal", key: "notaFiscal", width: 20 },
      { header: "CFOP", key: "cfop", width: 15 },
      { header: "Fornecedor", key: "fornecedor", width: 40 },
      { header: "Grupo", key: "grupo", width: 15 },
      { header: "Valor", key: "valor", width: 15 },
      { header: "Base de calculo", key: "baseCalculo", width: 15 },
      { header: "Aliquota", key: "aliquota", width: 15 },
      { header: "ICMS Destacado", key: "icmsDestacado", width: 30 },
    ];

    // Estilizando os cabeçalhos
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4CAF50' }, // Cor de fundo (verde)
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' }, // Cor da fonte (branco)
        size: 12,
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Popula os dados na planilha
    itens.forEach((item) => {

      const valor = Number(item.valor) / 100;
      const baseCalculo = item.notaFiscal.resumo ? Number(item.notaFiscal.resumo.baseCalculo) / 100 : 0;
      const aliquota = item.notaFiscal.resumo?.aliquota || 0;
      const icmsDestacado = item.notaFiscal.resumo ? Number(item.notaFiscal.resumo.icmsDestacado) / 100 : 0;

        // Converte a string 'dataEntrada' para o formato 'dd/mm/yyyy'
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
          valor,
          baseCalculo,
          aliquota,
          icmsDestacado
          
        });
        // Aplica formatação numérica brasileira (com separador de milhar e decimal)
          row.getCell("valor").numFmt = '#,##0.00';
          row.getCell("baseCalculo").numFmt = '#,##0.00';
          row.getCell("icmsDestacado").numFmt = '#,##0.00';
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
