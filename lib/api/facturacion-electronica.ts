/**
 * API para Facturación Electrónica
 */

import { apiRequest } from "../api";

export interface Factura {
  id: number;
  comprobante_electronico_id: number;
  venta_id: number;
  serie: string;
  numero: number;
  fecha_emision: string;
  fecha_vencimiento?: string;
  tipo_moneda: string;
  total: number;
  estado_sunat: string;
  comprobante_electronico?: ComprobanteElectronico;
  venta?: any;
  created_at: string;
  updated_at: string;
}

export interface NotaCredito {
  id: string;  // UUID
  tipo_documento: string;
  serie: string;
  numero: number;
  numero_completo: string;  // Serie-Número completo
  venta_id: string;
  motivo_id: number;
  descripcion?: string;
  monto_total: number;
  monto_igv: number;
  monto_subtotal: number;
  referencia_documento?: string;
  fecha_emision: string;
  estado: string;
  almacen_id: number;
  usuario_id: string;
  observaciones?: string;
  comprobante_electronico?: ComprobanteElectronico; // Comprobante de la nota de crédito
  comprobante_referencia?: ComprobanteElectronico; // Comprobante que se está afectando (factura/boleta original)
  motivo_nota?: MotivoNota;
  venta?: {
    id: string;
    cliente?: {
      numero_documento: string;
      razon_social?: string;
      nombres?: string;
      apellidos?: string;
      direccion?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface NotaDebito {
  id: string;  // UUID
  comprobante_electronico_id: number;
  comprobante_afectado_id: number;
  motivo_nota_id: number;
  serie: string;
  numero: string;  // Número completo con serie
  fecha_emision: string;
  tipo_moneda: string;
  total: number;
  estado_sunat: string;
  observaciones?: string;
  comprobante_electronico?: ComprobanteElectronico;
  comprobante_afectado?: ComprobanteElectronico;
  motivo_nota?: MotivoNota;
  created_at: string;
  updated_at: string;
}

export interface ComprobanteElectronico {
  id: number;
  tipo_comprobante: string;
  tipo_comprobante_nombre?: string;
  serie: string;
  correlativo: number;
  numero: string;  // Número completo con serie (ej: "F001-00000123")
  serie_numero?: string;
  fecha_emision: string;
  cliente_id?: number;
  moneda?: "PEN" | "USD"; // Campo principal
  tipo_moneda?: "PEN" | "USD"; // Alias para compatibilidad
  subtotal?: number;
  igv?: number;
  total?: number;
  estado_sunat: string;
  xml_path?: string;
  cdr_path?: string;
  pdf_path?: string;
  hash?: string;
  tiene_xml?: boolean; // ✅ Indica si tiene XML disponible
  tiene_cdr?: boolean; // ✅ Indica si tiene CDR disponible
  // Datos del cliente almacenados directamente en el comprobante
  cliente_tipo_documento?: string;
  cliente_numero_documento?: string;
  cliente_razon_social?: string;
  cliente_direccion?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  // Relación con cliente (opcional, puede no estar cargada)
  cliente?: {
    id: number;
    tipo_cliente?: string;
    tipo_documento?: string;
    numero_documento: string;
    nombres?: string;
    apellidos?: string;
    razon_social?: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  detalles?: DetalleComprobanteElectronico[];
  venta_id?: number;
  created_at: string;
  updated_at: string;
}

export interface DetalleComprobanteElectronico {
  id: number;
  comprobante_electronico_id: number;
  codigo_producto: string; // Código del producto (directo de la tabla)
  descripcion: string; // Descripción del producto
  unidad_medida: string; // Unidad de medida SUNAT (directo de la tabla)
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  igv: number;
  total: number;
  tipo_moneda?: string;
}

export interface MotivoNota {
  id: number;
  tipo: "NC" | "ND";
  codigo_sunat: string;
  descripcion: string;
  estado: number;
  created_at: string;
  updated_at: string;
}

export interface CrearNotaCreditoData {
  venta_id: string;
  motivo_id: number;
  serie: string;
  almacen_id: number;
  numero?: number;
  descripcion: string;
  monto_total: number;
  monto_igv: number;
  monto_subtotal: number;
  fecha?: string;
  observaciones?: string;
  items: {
    producto_id: number;
    unidad_derivada_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    igv: number;
    total: number;
  }[];
}

export interface CrearNotaDebitoData {
  venta_id: number;
  motivo_id: number;
  serie: string;
  almacen_id: number;
  numero?: number;
  descripcion: string;
  monto_total: number;
  monto_igv: number;
  monto_subtotal: number;
  fecha?: string;
  observaciones?: string;
  items: {
    producto_id: number;
    unidad_derivada_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    igv: number;
    total: number;
  }[];
}

export const facturacionElectronicaApi = {
  // Comprobantes Electrónicos
  async buscarComprobantes(params: {
    query: string;
    tipo?: "01" | "03"; // 01=Factura, 03=Boleta
    limit?: number;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return apiRequest<{ data: ComprobanteElectronico[] }>(
      `/facturacion-electronica/comprobantes/buscar?${queryString}`
    );
  },

  async getComprobanteById(id: number) {
    return apiRequest<{ data: ComprobanteElectronico }>(
      `/facturacion-electronica/comprobantes/${id}`
    );
  },

  // Facturas
  async getFacturas(params?: {
    search?: string;
    estado_sunat?: string;
    desde?: string;
    hasta?: string;
    cliente_id?: number;
    page?: number;
    per_page?: number;
  }) {
    const queryString = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : "";
    return apiRequest<{ data: Factura[]; total: number }>(
      `/facturacion-electronica/facturas${queryString}`
    );
  },

  async getFacturaById(id: number) {
    return apiRequest<Factura>(`/facturacion-electronica/facturas/${id}`);
  },

  async generarComprobanteDesdeVenta(ventaId: string) {
    return apiRequest(`/facturacion-electronica/facturas/generar`, {
      method: "POST",
      body: JSON.stringify({ venta_id: ventaId }),
    });
  },

  async enviarFacturaSunat(ventaId: string) {
    return apiRequest(`/facturacion-electronica/facturas/${ventaId}/enviar-sunat`, {
      method: "POST",
    });
  },

  // Notas de Crédito
  async getNotasCredito(params?: {
    search?: string;
    estado_sunat?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    per_page?: number;
  }) {
    const queryString = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : "";
    return apiRequest<{ data: NotaCredito[]; total: number }>(
      `/facturacion-electronica/notas-credito${queryString}`
    );
  },

  async getNotaCreditoById(id: string) {
    return apiRequest<NotaCredito>(`/facturacion-electronica/notas-credito/${id}`);
  },

  async crearNotaCredito(data: CrearNotaCreditoData) {
    return apiRequest<{ data: NotaCredito }>("/facturacion-electronica/notas-credito", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async enviarNotaCreditoSunat(id: number) {
    return apiRequest(`/facturacion-electronica/notas-credito/${id}/enviar-sunat`, {
      method: "POST",
    });
  },

  async generarPdfNotaCredito(id: number | string) {
    return apiRequest<NotaCredito>(`/facturacion-electronica/notas-credito/${id}/pdf`);
  },

  async validarVentaParaNotaCredito(ventaId: number) {
    return apiRequest(`/facturacion-electronica/notas-credito/validar-venta/${ventaId}`);
  },

  // Notas de Débito
  async getNotasDebito(params?: {
    search?: string;
    estado_sunat?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    per_page?: number;
  }) {
    const queryString = params
      ? "?" + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : "";
    return apiRequest<{ data: NotaDebito[]; total: number }>(
      `/facturacion-electronica/notas-debito${queryString}`
    );
  },

  async getNotaDebitoById(id: number) {
    return apiRequest<NotaDebito>(`/facturacion-electronica/notas-debito/${id}`);
  },

  async crearNotaDebito(data: CrearNotaDebitoData) {
    return apiRequest<{ data: NotaDebito }>("/facturacion-electronica/notas-debito", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async enviarNotaDebitoSunat(id: number) {
    return apiRequest(`/facturacion-electronica/notas-debito/${id}/enviar-sunat`, {
      method: "POST",
    });
  },

  async validarVentaParaNotaDebito(ventaId: number) {
    return apiRequest(`/facturacion-electronica/notas-debito/validar-venta/${ventaId}`);
  },

  // Motivos de Nota
  async getMotivosNota() {
    return apiRequest<{ data: MotivoNota[] }>(`/facturacion-electronica/motivos-nota`);
  },

  async getMotivosCredito() {
    return apiRequest<{ data: MotivoNota[] }>(`/facturacion-electronica/motivos-nota/credito`);
  },

  async getMotivosDebito() {
    return apiRequest<{ data: MotivoNota[] }>(`/facturacion-electronica/motivos-nota/debito`);
  },

  async getMotivoNotaById(id: number) {
    return apiRequest<{ data: MotivoNota }>(`/facturacion-electronica/motivos-nota/${id}`);
  },
};
