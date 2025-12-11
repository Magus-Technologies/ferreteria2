import { pdf } from "@react-pdf/renderer";
import { Prisma } from "@prisma/client";
import PDFVentaDocument from "./pdf-venta-document";

export type VentaConRelaciones = Prisma.VentaGetPayload<{
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

export async function generarPDFVenta(
  venta: VentaConRelaciones
): Promise<Buffer> {
  const blob = await pdf(<PDFVentaDocument venta={venta} />).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
