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

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Arquivo processado com sucesso!",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: data.error || "Erro ao processar o arquivo",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Erro ao processar o arquivo",
      });
    }
  };

  return (
    <div className=" flex gap-2">
      <input 
      type="file" 
      onChange={handleFileChange} 
      accept=".txt"  
      className="bg-white text-black border-2 rounded-md p-4 border-gray-50
                    hover:border-gray-200 hover:bg-gray-100 cursor-pointer"
      />


      <button onClick={handleUpload} className="bg-green-600 text-white font-semibold px-6  rounded-sm border-2 border-green-700 hover:border-green-700 hover:bg-green-800 cursor-pointer">Enviar</button>
    </div>
  );
}
