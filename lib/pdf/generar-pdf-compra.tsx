import { pdf } from "@react-pdf/renderer";
import { Prisma } from "@prisma/client";
import PDFCompraDocument from "./pdf-compra-document";
import path from "path";
import fs from "fs";

export type CompraConRelaciones = Prisma.CompraGetPayload<{
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
    user: {
      include: {
        empresa: true;
      };
    };
    proveedor: true;
    almacen: true;
    pagos_de_compras: true;
  };
}>;

// Función para obtener el logo como Data URI
function getLogoDataURI(): string {
  try {
    // Ruta absoluta al logo en el directorio public
    const logoPath = path.join(process.cwd(), 'public', 'logo-vertical.png');

    // Leer el archivo
    const imageBuffer = fs.readFileSync(logoPath);

    // Convertir a Base64
    const base64Image = imageBuffer.toString('base64');

    // Retornar como Data URI
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('Error al cargar logo:', error);

    // Intentar con logoPdf.png como fallback
    try {
      const fallbackPath = path.join(process.cwd(), 'public', 'logoPdf.png');
      const imageBuffer = fs.readFileSync(fallbackPath);
      const base64Image = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64Image}`;
    } catch (fallbackError) {
      console.error('Error al cargar logo fallback:', fallbackError);
      // Retornar un placeholder vacío
      return '';
    }
  }
}

export async function generarPDFCompra(
  compra: CompraConRelaciones
): Promise<Buffer> {
  const logoDataURI = getLogoDataURI();

  const blob = await pdf(
    <PDFCompraDocument compra={compra} logoDataURI={logoDataURI} />
  ).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
