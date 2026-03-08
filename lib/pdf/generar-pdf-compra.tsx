import { pdf } from "@react-pdf/renderer";
import PDFCompraDocument from "./pdf-compra-document";
import path from "path";
import fs from "fs";

export interface CompraConRelaciones {
  id: string;
  tipo_documento: string;
  serie: string | null;
  numero: number | null;
  descripcion: string | null;
  forma_de_pago: string;
  fecha: string;
  productos_por_almacen: {
    costo: number | string;
    producto_almacen: {
      producto: {
        cod_producto: string;
        name: string;
        marca: { name: string };
        unidad_medida: { name: string } | null;
      };
    };
    unidades_derivadas: {
      cantidad: number | string;
      factor: number | string;
      unidad_derivada_inmutable: { name: string };
    }[];
  }[];
  user: {
    name: string;
    empresa: {
      ruc: string;
      razon_social: string;
      direccion: string;
      telefono: string;
      email: string;
      logo: string | null;
    } | null;
  };
  proveedor: {
    ruc: string;
    razon_social: string;
  } | null;
  almacen: {
    name: string;
  } | null;
  pagos_de_compras: {
    monto: number | string;
  }[];
}

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
