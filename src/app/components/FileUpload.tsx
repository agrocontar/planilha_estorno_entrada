"use client"
import { SetStateAction, useState } from "react";

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
      setMessage("Selecione um arquivo primeiro!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Arquivo enviado com sucesso!");
      } else {
        setMessage(data.error || "Erro ao enviar o arquivo");
      }
    } catch (error) {
      setMessage("Erro ao enviar o arquivo");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".txt" />
      <button onClick={handleUpload}>Enviar</button>
      {message && <p>{message}</p>}
    </div>
  );
}
