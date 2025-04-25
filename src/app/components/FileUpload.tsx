"use client"
import { useState } from "react";
import Swal from "sweetalert2";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [tipoNotaSelecionado, setTipoNotaSelecionado] = useState("0"); // "0" para entrada por padrão

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  // Função para exibir mensagem de alerta caso selecionar estorno de saída
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valorSelecionado = e.target.value;
    setTipoNotaSelecionado(valorSelecionado);

    if (valorSelecionado === "1") {
      Swal.fire({
        icon: "info",
        title: "Atenção!",
        text: "Para gerar a planilha de Estorno Saída, o arquivo deve comtemplar os registros C170 nas notas de Saída!",
      });
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
    formData.append("tipoNotaSelecionado", tipoNotaSelecionado);

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

      const fileDataResponse = await fetch("/api/getFileData");
      const fileData = await fileDataResponse.json();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Planilha de Estorno - ${fileData.cnpj}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      Swal.fire({
        icon: "success",
        title: "Arquivo processado com Sucesso!",
        text: "A legenda dos grupos de NCM está disponível na documentação de usuário para consulta",
      });

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: String(error),
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-row gap-2 items-center">

        <div className="flex flex-col gap-2">
          <label className="text-black font-semibold">Selecione o arquivo SPED:</label>
          {/* Input para selecionar o arquivo */} 
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept=".txt"  
            className="bg-white text-black border-2 rounded-md p-2 border-gray-200
                      hover:border-gray-300 hover:bg-gray-100 cursor-pointer"
          />
        </div>
        

        <div className="flex flex-col gap-2">
          <label className="text-black font-semibold">Tipo de Estorno:</label>
          {/* Select para escolher o tipo de nota */}
          <select
            value={tipoNotaSelecionado}
            onChange={handleSelectChange}
            className="p-2 border-2 rounded-md bg-white text-black border-gray-200 cursor-pointer"
          >
            <option value="0">Entrada</option>
            <option value="1">Saída</option>
          </select>
        </div>
        

        

      </div>

      <button 
          onClick={handleUpload} 
          className="bg-green-600 text-white font-semibold p-2 rounded-sm border-2 border-green-700 hover:border-green-800 cursor-pointer"
        >
          Enviar
        </button>
    </div>
  );
}
