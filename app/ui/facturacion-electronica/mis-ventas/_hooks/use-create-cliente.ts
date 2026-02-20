import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import {
  clienteApi,
  type Cliente,
  type CreateClienteRequest,
  type DireccionFormValues,
  TipoDireccion,
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
    mutationFn: async (values: FormCreateClienteValues) => {
      // Paso 1: Crear/actualizar el cliente (sin direcciones en el modelo antiguo)
      const clienteData: CreateClienteRequest = {
        tipo_cliente: values.tipo_cliente,
        numero_documento: values.numero_documento,
        nombres: values.nombres || "",
        apellidos: values.apellidos || "",
        razon_social: values.razon_social || null,
        telefono: values.telefono || null,
        email: values.email || null,
        estado: true,
      };

      let clienteResponse;
      if (dataEdit?.id) {
        clienteResponse = await clienteApi.update(dataEdit.id, clienteData);
      } else {
        clienteResponse = await clienteApi.create(clienteData);
      }

      if (clienteResponse.error || !clienteResponse.data?.data) {
        return clienteResponse;
      }

      const cliente = clienteResponse.data.data;

      // Paso 2: Guardar/actualizar las direcciones en la tabla direcciones_cliente
      if (dataEdit?.id) {
        // MODO EDICIÓN: Obtener direcciones existentes y actualizarlas
        const direccionesExistentesResponse = await clienteApi.listarDirecciones(cliente.id);
        const direccionesExistentes = direccionesExistentesResponse.data?.data || [];

        // Mapear direcciones existentes por tipo
        const direccionesMap = new Map(
          direccionesExistentes.map(dir => [dir.tipo, dir])
        );

        // Actualizar o crear cada dirección
        const direccionesNuevas = [
          { tipo: TipoDireccion.D1, direccion: values.direccion, latitud: values.latitud_d1, longitud: values.longitud_d1 },
          { tipo: TipoDireccion.D2, direccion: values.direccion_2, latitud: values.latitud_d2, longitud: values.longitud_d2 },
          { tipo: TipoDireccion.D3, direccion: values.direccion_3, latitud: values.latitud_d3, longitud: values.longitud_d3 },
          { tipo: TipoDireccion.D4, direccion: values.direccion_4, latitud: values.latitud_d4, longitud: values.longitud_d4 },
        ];

        for (const dirNueva of direccionesNuevas) {
          if (dirNueva.direccion) {
            const dirExistente = direccionesMap.get(dirNueva.tipo);
            
            if (dirExistente) {
              // Actualizar dirección existente
              await clienteApi.actualizarDireccion(dirExistente.id, {
                direccion: dirNueva.direccion,
                latitud: dirNueva.latitud ?? undefined,
                longitud: dirNueva.longitud ?? undefined,
              });
            } else {
              // Crear nueva dirección
              await clienteApi.crearDireccion(cliente.id, {
                direccion: dirNueva.direccion,
                latitud: dirNueva.latitud ?? undefined,
                longitud: dirNueva.longitud ?? undefined,
              });
            }
          } else if (direccionesMap.has(dirNueva.tipo)) {
            // Si la dirección está vacía pero existe en la BD, eliminarla (excepto D1)
            const dirExistente = direccionesMap.get(dirNueva.tipo);
            if (dirExistente && dirNueva.tipo !== TipoDireccion.D1) {
              await clienteApi.eliminarDireccion(dirExistente.id);
            }
          }
        }
      } else {
        // MODO CREACIÓN: Crear direcciones nuevas
        const direcciones: Array<{ direccion: string; latitud?: number; longitud?: number }> = [];

        if (values.direccion) {
          direcciones.push({
            direccion: values.direccion,
            latitud: values.latitud_d1 ?? undefined,
            longitud: values.longitud_d1 ?? undefined,
          });
        }

        if (values.direccion_2) {
          direcciones.push({
            direccion: values.direccion_2,
            latitud: values.latitud_d2 ?? undefined,
            longitud: values.longitud_d2 ?? undefined,
          });
        }

        if (values.direccion_3) {
          direcciones.push({
            direccion: values.direccion_3,
            latitud: values.latitud_d3 ?? undefined,
            longitud: values.longitud_d3 ?? undefined,
          });
        }

        if (values.direccion_4) {
          direcciones.push({
            direccion: values.direccion_4,
            latitud: values.latitud_d4 ?? undefined,
            longitud: values.longitud_d4 ?? undefined,
          });
        }

        // Guardar cada dirección en la tabla direcciones_cliente
        // El servicio asignará automáticamente los tipos D1, D2, D3, D4
        for (const dir of direcciones) {
          await clienteApi.crearDireccion(cliente.id, dir);
        }
      }

      return clienteResponse;
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
    mutation.mutate(values);
  }

  return {
    crearClienteForm,
    loading: mutation.isPending,
  };
}
