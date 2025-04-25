import Image from "next/image";
import FileUpload from "./components/FileUpload";
import OpenPDF from "./components/openPDF";

export default function Home() {


  
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">

        <h1
        className="text-green-800 text-4xl font-semibold pb-32"
        >Planilha de Estorno - Entrada ou Saída</h1>

        <FileUpload/>

        <OpenPDF  />
        
      </div>

      <footer className="fixed bottom-0 left-0 w-full text-black text-center p-4 flex flex-col items-center justify-center gap-4">
        <Image src="/logo.png.webp" alt="Agrocontar" width={100} height={100} />
        <p className="text-sm"> © Direitos Reservados a Agrocontar</p>
      </footer>
    </>
  );
}
