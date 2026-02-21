import { apiRequest } from '~/lib/api'

export interface CumpleanosUsuario {
  id: string
  nombre: string
  imagen: string | null
  fecha_nacimiento: string
  dias_restantes: number
  edad: number
  tipo: 'hoy' | '3dias' | 'proximo'
}

export const cumpleanosApi = {
  async getProximos() {
    return apiRequest<{ data: CumpleanosUsuario[] }>('/cumpleanos/proximos')
  },
}
