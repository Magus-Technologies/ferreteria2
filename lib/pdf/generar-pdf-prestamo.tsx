import { pdf } from "@react-pdf/renderer";
import PDFPrestamoDocument from "./pdf-prestamo-document";
import { Prestamo } from "../api/prestamo";

export async function generarPDFPrestamo(
  prestamo: Prestamo
): Promise<Buffer> {
  const blob = await pdf(<PDFPrestamoDocument prestamo={prestamo} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
