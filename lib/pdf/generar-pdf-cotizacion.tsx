import { pdf } from "@react-pdf/renderer";
import { Prisma } from "@prisma/client";
import PDFCotizacionDocument from "./pdf-cotizacion-document";

export type CotizacionConRelaciones = Prisma.CotizacionGetPayload<{
  include: {
    productos_por_almacen: {
      include: {
        producto_almacen: {
          include: {
            producto: {
              include: {
                marca: true;
                unidad_medida: true;
              };
            };
          };
        };
        unidades_derivadas: {
          include: {
            unidad_derivada_inmutable: true;
          };
        };
      };
    };
    user: true;
    cliente: true;
    almacen: true;
  };
}>;

export async function generarPDFCotizacion(
  cotizacion: CotizacionConRelaciones
): Promise<Buffer> {
  const blob = await pdf(<PDFCotizacionDocument cotizacion={cotizacion} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
