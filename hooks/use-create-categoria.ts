import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import {
  categoriasApi,
  type Categoria,
} from "~/lib/api/catalogos";
import { QueryKeys } from "~/app/_lib/queryKeys";

export default function useCreateCategoria({
  onSuccess,
}: {
  onSuccess?: (categoria: Categoria) => void;
} = {}) {
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const mutation = useMutation({
    mutationFn: async (data: { name: string; estado?: boolean }) => {
      return await categoriasApi.create(data);
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
          description: "Categoría creada exitosamente",
        });

        // Invalidar queries para refrescar las listas
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.CATEGORIAS],
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

  function crearCategoria(name: string) {
    const data = {
      name,
      estado: true,
    };

    mutation.mutate(data);
  }

  return {
    crearCategoria,
    loading: mutation.isPending,
  };
}
