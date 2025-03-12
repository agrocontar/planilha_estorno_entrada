"use client"
import { SetStateAction, useState } from "react";
import Swal from "sweetalert2";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Swal.fire({
        icon: "warning",
        title: "Atenção!",
        text: "Selecione um arquivo primeiro!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    Swal.fire({
      title: "Processando...",
      text: "Aguarde enquanto o arquivo está sendo processado.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar o arquivo");
      }
    
      // Criar um Blob a partir da resposta
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
    
      // Criar um link temporário para download
      const a = document.createElement("a");
      a.href = url;
       // Gera um nome de arquivo baseado na data atual e hora
      const now = new Date();
      const timestamp = now.toLocaleDateString('pt-BR').replace(/\//g, '-'); // Formato 'DD-MM-YYYY'

      a.download = `Planilha de Estorno Entrada  ${timestamp}.xlsx`; // Defina o nome do arquivo
      document.body.appendChild(a);
      a.click();
      a.remove();
    
      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Arquivo processado e baixado com sucesso!",
      });
    
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: (error instanceof Error ? error.message : "Erro ao processar o arquivo"),
      });
    }
  };

  return (
    <div className=" flex gap-2">
      <input 
      type="file" 
      onChange={handleFileChange} 
      accept=".txt"  
      className="bg-white text-black border-2 rounded-md p-4 border-gray-200
                    hover:border-gray-300 hover:bg-gray-100 cursor-pointer"
      />


      <button onClick={handleUpload} className="bg-green-600 text-white font-semibold px-6  rounded-sm border-2 border-green-700 hover:border-green-700 hover:bg-green-800 cursor-pointer">Enviar</button>
    </div>
  );
}
