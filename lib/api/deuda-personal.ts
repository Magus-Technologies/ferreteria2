import { apiRequest } from '../api'

export interface DeudaPersonal {
    id: number;
    user_id: number;
    arqueo_diario_id: string | null;
    monto: number;
    estado: 'pendiente' | 'pagado' | 'anulado';
    observaciones: string | null;
    created_at: string;
    updated_at: string;
    user?: any;
    arqueo_diario?: any;
}

export interface ListarDeudasResponse {
    success: boolean;
    data: {
        current_page: number;
        data: DeudaPersonal[];
        last_page: number;
        per_page: number;
        total: number;
    };
}

export const deudaPersonalApi = {
    /**
     * Listar deudas de personal
     */
    listar: async (params?: { user_id?: number; estado?: string; page?: number }) => {
        let url = '/cajas/deudas-personal';
        if (params) {
            const query = new URLSearchParams();
            if (params.user_id) query.append('user_id', params.user_id.toString());
            if (params.estado) query.append('estado', params.estado);
            if (params.page) query.append('page', params.page.toString());
            url += `?${query.toString()}`;
        }

        const response = await apiRequest<ListarDeudasResponse>(url, {
            method: 'GET',
        });
        return response.data;
    },

    /**
     * Marcar deuda como pagada
     */
    pagar: async (id: number, observaciones?: string) => {
        const response = await apiRequest<{ success: boolean; message: string; data: DeudaPersonal }>(
            `/cajas/deudas-personal/${id}/pagar`,
            {
                method: 'POST',
                body: JSON.stringify({ observaciones }),
            }
        );
        return response.data;
    },
}
