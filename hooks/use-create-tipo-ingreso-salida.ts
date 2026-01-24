import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import {
  tipoIngresoSalidaApi,
  type TipoIngresoSalida,
  type CreateTipoIngresoSalidaRequest,
} from "~/lib/api/tipo-ingreso-salida";
import { QueryKeys } from "~/app/_lib/queryKeys";

export default function useCreateTipoIngresoSalida({
  onSuccess,
}: {
  onSuccess?: (tipoIngresoSalida: TipoIngresoSalida) => void;
} = {}) {
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const mutation = useMutation({
    mutationFn: async (data: CreateTipoIngresoSalidaRequest) => {
      return await tipoIngresoSalidaApi.create(data);
    },
    onSuccess: (response) => {
      if (response.error) {
        notification.error({
          message: "Error",
          description: response.error.message,
        });
        return;
      }

      if (response.data?.data) {
        notification.success({
          message: "Operación exitosa",
          description: "Tipo Ingreso/Salida creado exitosamente",
        });

        // Invalidar queries para refrescar las listas
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.TIPOS_INGRESO_SALIDA],
        });

        // Llamar al callback de éxito
        onSuccess?.(response.data.data);
      }
    },
    onError: (error: Error) => {
      notification.error({
        message: "Error",
        description: error.message || "Error al procesar la solicitud",
      });
    },
  });

  function crearTipoIngresoSalida(name: string) {
    const data: CreateTipoIngresoSalidaRequest = {
      name,
      estado: true,
    };

    mutation.mutate(data);
  }

  return {
    crearTipoIngresoSalida,
    loading: mutation.isPending,
  };
}
