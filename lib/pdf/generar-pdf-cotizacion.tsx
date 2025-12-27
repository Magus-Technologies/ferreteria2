import { pdf } from "@react-pdf/renderer";
import PDFCotizacionDocument from "./pdf-cotizacion-document";

// Tipo genérico para cotización (compatible con Prisma y Laravel)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CotizacionConRelaciones = any;

export async function generarPDFCotizacion(
  cotizacion: CotizacionConRelaciones
): Promise<Buffer> {
  const blob = await pdf(<PDFCotizacionDocument cotizacion={cotizacion} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
