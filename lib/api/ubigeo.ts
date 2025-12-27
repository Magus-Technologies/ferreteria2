import { apiRequest } from '../api';

// ============= INTERFACES =============

export interface Departamento {
  id_ubigeo: number;
  departamento: string;
  nombre: string;
}

export interface Provincia {
  id_ubigeo: number;
  departamento: string;
  provincia: string;
  nombre: string;
}

export interface Distrito {
  id_ubigeo: number;
  departamento: string;
  provincia: string;
  distrito: string;
  nombre: string;
}

export interface Ubigeo {
  id_ubigeo: number;
  departamento: string;
  provincia: string;
  distrito: string;
  nombre: string;
}

// ============= API METHODS =============

export const ubigeoApi = {
  // Obtener todos los departamentos
  getDepartamentos: async (): Promise<Departamento[]> => {
    const response = await apiRequest<{ data: Departamento[] }>('/departamentos');
    return response.data?.data || [];
  },

  // Obtener provincias de un departamento
  getProvincias: async (codigoDepartamento: string): Promise<Provincia[]> => {
    const response = await apiRequest<{ data: Provincia[] }>(
      `/departamentos/${codigoDepartamento}/provincias`
    );
    return response.data?.data || [];
  },

  // Obtener distritos de una provincia
  getDistritos: async (codigoDepartamento: string, codigoProvincia: string): Promise<Distrito[]> => {
    const response = await apiRequest<{ data: Distrito[] }>(
      `/provincias/${codigoDepartamento}/${codigoProvincia}/distritos`
    );
    return response.data?.data || [];
  },
};
