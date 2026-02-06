import { apiRequest, ApiResponse } from '../api';

export interface NotaDebitoItem {
  codigo: string;
  unidad: string;
  cantidad: number;
  descripcion: string;
  valor_unitario: number;
  precio_unitario: number;
  tipo_afectacion_igv?: '10' | '20' | '30';
}

export interface NotaDebitoCliente {
  tipo_doc: '1' | '6';
  num_doc: string;
  razon_social: string;
  direccion?: string;
}

export interface CrearNotaDebitoData {
  serie: string;
  numero: number;
  fecha: string;
  tipo_doc_afectado: '01' | '03';
  num_doc_afectado: string;
  cod_motivo: '01' | '02' | '03' | '10' | '11';
  des_motivo: string;
  tipo_moneda: 'PEN' | 'USD';
  cliente: NotaDebitoCliente;
  items: NotaDebitoItem[];
}

export interface NotaDebitoResponse {
  success: boolean;
  message: string;
  data?: {
    hash: string;
    xml: string;
    xml_filename?: string;
    cdr?: {
      code: string;
      description: string;
    };
    modo_simulacion?: boolean;
  };
}

export const notaDebitoApi = {
  crear: async (data: CrearNotaDebitoData): Promise<NotaDebitoResponse> => {
    const response = await apiRequest<NotaDebitoResponse>('/notas-debito', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data as NotaDebitoResponse;
  },

  consultarEstado: async (params: {
    ruc: string;
    tipo_doc: string;
    serie: string;
    numero: string;
  }): Promise<ApiResponse> => {
    const response = await apiRequest('/notas-debito/consultar-estado', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return response.data as ApiResponse;
  },

  verXml: (serie: string, numero: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/notas-debito/${serie}/${numero}/xml`;
  },
};
