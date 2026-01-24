import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import {
  marcasApi,
  type Marca,
} from "~/lib/api/catalogos";
import { QueryKeys } from "~/app/_lib/queryKeys";

export default function useCreateMarca({
  onSuccess,
}: {
  onSuccess?: (marca: Marca) => void;
} = {}) {
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const mutation = useMutation({
    mutationFn: async (data: { name: string; estado?: boolean }) => {
      return await marcasApi.create(data);
    },
    onSuccess: (response) => {
      if (response.error) {
        notification.error({
          message: "Error",
          description: response.error.message,
        });
        return;
      }

      if (response.data) {
        notification.success({
          message: "Operación exitosa",
          description: "Marca creada exitosamente",
        });

        // Invalidar queries para refrescar las listas
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.MARCAS],
        });

        // Llamar al callback de éxito
        onSuccess?.(response.data);
      }
    },
    onError: (error: Error) => {
      notification.error({
        message: "Error",
        description: error.message || "Error al procesar la solicitud",
      });
    },
  });

  function crearMarca(name: string) {
    const data = {
      name,
      estado: true,
    };

    mutation.mutate(data);
  }

  return {
    crearMarca,
    loading: mutation.isPending,
  };
}
