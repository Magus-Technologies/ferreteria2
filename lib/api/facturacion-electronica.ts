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
  id: number;
  comprobante_electronico_id: number;
  comprobante_afectado_id: number;
  motivo_nota_id: number;
  serie: string;
  numero: number;
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

export interface NotaDebito {
  id: number;
  comprobante_electronico_id: number;
  comprobante_afectado_id: number;
  motivo_nota_id: number;
  serie: string;
  numero: number;
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
  serie: string;
  numero: number;
  fecha_emision: string;
  cliente_id: number;
  tipo_moneda: string;
  total: number;
  estado_sunat: string;
  xml_path?: string;
  cdr_path?: string;
  pdf_path?: string;
  hash?: string;
  cliente?: any;
  detalles?: DetalleComprobanteElectronico[];
  created_at: string;
  updated_at: string;
}

export interface DetalleComprobanteElectronico {
  id: number;
  comprobante_electronico_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  igv: number;
  total: number;
  producto?: any;
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

  async getNotaCreditoById(id: number) {
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
