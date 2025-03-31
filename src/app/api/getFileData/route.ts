import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const fileData = await prisma.fileData.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        fisrtDate: true,  
        lastDate: true,
        cnpj: true,
      },
    });

    if(!fileData){
      return Response.json({ error: "Nenhum dado encontrado no cabeçalho!" }, { status: 404 });
    }

    return Response.json(fileData);
  } catch (error) {
    return Response.json({ error: "Erro ao buscar os dados" }, { status: 500 });
  }
}
