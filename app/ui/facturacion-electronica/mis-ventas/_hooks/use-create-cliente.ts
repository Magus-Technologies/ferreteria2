import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import {
  clienteApi,
  type Cliente,
  type CreateClienteRequest,
} from "~/lib/api/cliente";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { FormCreateClienteValues } from "../_components/modals/modal-create-cliente";

export default function useCreateCliente({
  onSuccess,
  dataEdit,
}: {
  onSuccess?: (cliente: Cliente) => void;
  dataEdit?: Cliente;
}) {
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const mutation = useMutation({
    mutationFn: async (data: CreateClienteRequest) => {
      if (dataEdit?.id) {
        // Actualizar cliente existente
        return await clienteApi.update(dataEdit.id, data);
      } else {
        // Crear nuevo cliente
        return await clienteApi.create(data);
      }
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
        const successMessage = dataEdit
          ? "Cliente editado exitosamente"
          : "Cliente creado exitosamente";

        notification.success({
          message: "Operación exitosa",
          description: successMessage,
        });

        // Invalidar queries para refrescar las listas
        queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] });
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.CLIENTES_SEARCH],
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

  function crearClienteForm(values: FormCreateClienteValues) {
    // Convertir valores del formulario al formato de la API
    const data: CreateClienteRequest = {
      tipo_cliente: values.tipo_cliente,
      numero_documento: values.numero_documento,
      nombres: values.nombres || "",
      apellidos: values.apellidos || "",
      razon_social: values.razon_social || null,
      direccion: values.direccion || null,
      direccion_2: values.direccion_2 || null,
      direccion_3: values.direccion_3 || null,
      direccion_4: values.direccion_4 || null,
      telefono: values.telefono || null,
      email: values.email || null,
      estado: true,
    };

    mutation.mutate(data);
  }

  return {
    crearClienteForm,
    loading: mutation.isPending,
  };
}
