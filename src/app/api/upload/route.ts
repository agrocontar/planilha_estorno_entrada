// Importa as dependências necessárias
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import os from "os";
import fs from "fs/promises";
import path from "path";
import { processSpedFile } from "@/untils/processSped";
import { generateFile } from "@/untils/generateFile";

const tempDir = os.tmpdir(); // Retorna a pasta temporária do sistema operacional
const tempPath = path.join(tempDir, "tempfile"); // Caminho correto


// Define um esquema de validação para os dados usando zod
const dataSchema = z.object({
  content: z.string().min(1, "O arquivo não pode estar vazio"),
});

// Função assíncrona que lida com requisições POST
export async function POST(req: Request) {
  try {
    // Extrai os dados do formulário da requisição
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // Verifica se o arquivo foi enviado
    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    // Converte o arquivo para um buffer e depois para uma string
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempDir = os.tmpdir(); // Obtém a pasta temporária correta
    const tempPath = path.join(tempDir, file.name); // Define o caminho do arquivo

    await fs.writeFile(tempPath, buffer);
    const fileContent = await fs.readFile(tempPath, "utf-8");

    // Valida o conteúdo do arquivo usando o esquema definido
    const validation = dataSchema.safeParse({ content: fileContent });
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    // Salva os dados do arquivo no banco de dados usando Prisma
    const savedData = await prisma.fileData.create({
      data: { content: fileContent },
    });

    // Processar o arquivo
    const response = await processSpedFile(tempPath);
    const arquivoPath = await generateFile()

     // Lê o arquivo gerado para envio
     const fileBuffer = await fs.readFile(arquivoPath);

      // Gera um nome de arquivo baseado na data atual e hora
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-'); // Formato 'YYYY-MM-DDTHH-MM-SS'


    // Retorna uma resposta de sucesso
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="arquivo_${timestamp}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      },
    });
  } catch (error) {
    // Trata erros e retorna uma resposta apropriada
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro desconhecido" }, { status: 500 });
  }
}