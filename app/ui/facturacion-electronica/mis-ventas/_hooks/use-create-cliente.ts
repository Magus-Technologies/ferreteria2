import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import dayjs from "dayjs";
import {
  clienteApi,
  TIPOS_DIRECCION_LIST,
  TipoDireccion,
  type Cliente,
  type CreateClienteRequest,
} from "~/lib/api/cliente";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { FormCreateClienteValues } from "../_components/modals/modal-create-cliente";

/**
 * Mapeo de cada tipo de dirección a las 4 keys del form donde el hook
 * `useDireccionesClienteForm` escribe los valores legacy. Antes este
 * mapeo estaba duplicado como switch en `crearClienteForm` — ahora vive
 * acá y se itera con `TIPOS_DIRECCION_LIST`.
 */
const FORM_DIRECCION_FIELDS: Record<TipoDireccion, {
  direccion: keyof FormCreateClienteValues | string
  referencia: string
  latitud: string
  longitud: string
}> = {
  [TipoDireccion.D1]: { direccion: "direccion", referencia: "referencia_d1", latitud: "latitud_d1", longitud: "longitud_d1" },
  [TipoDireccion.D2]: { direccion: "direccion_2", referencia: "referencia_d2", latitud: "latitud_d2", longitud: "longitud_d2" },
  [TipoDireccion.D3]: { direccion: "direccion_3", referencia: "referencia_d3", latitud: "latitud_d3", longitud: "longitud_d3" },
  [TipoDireccion.D4]: { direccion: "direccion_4", referencia: "referencia_d4", latitud: "latitud_d4", longitud: "longitud_d4" },
}

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
        celular: values.celular || null,
        profesion_id: values.profesion_id || null,
        email: values.email || null,
        fecha_nacimiento: values.fecha_nacimiento
          ? dayjs(values.fecha_nacimiento).format('YYYY-MM-DD')
          : null,
        estado:
          values.estado === undefined || values.estado === null
            ? true
            : Boolean(Number(values.estado)),
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

      // Paso 2: Recolectar las direcciones desde el form (un slot por tipo).
      // El form llena los campos legacy `direccion`/`direccion_2..4` +
      // `referencia_d*` + `latitud_d*` + `longitud_d*` automáticamente
      // gracias al hook `useDireccionesClienteForm`.
      const direccionesDesdeForm = TIPOS_DIRECCION_LIST.map((tipo) => {
        const fields = FORM_DIRECCION_FIELDS[tipo]
        const valuesAny = values as unknown as Record<string, unknown>
        return {
          tipo,
          direccion: ((valuesAny[fields.direccion as string] as string | null | undefined) ?? "").trim(),
          referencia: (valuesAny[fields.referencia] as string | null | undefined) ?? null,
          latitud: (valuesAny[fields.latitud] as number | null | undefined) ?? undefined,
          longitud: (valuesAny[fields.longitud] as number | null | undefined) ?? undefined,
        }
      })

      if (dataEdit?.id) {
        // MODO EDICIÓN: comparar con las direcciones existentes y aplicar
        // create / update / delete por tipo.
        const direccionesExistentesResponse = await clienteApi.listarDirecciones(cliente.id);
        const direccionesExistentes = direccionesExistentesResponse.data?.data || [];
        const direccionesMap = new Map(direccionesExistentes.map((d) => [d.tipo, d]))

        for (const dirNueva of direccionesDesdeForm) {
          const dirExistente = direccionesMap.get(dirNueva.tipo)
          const tieneDatos =
            dirNueva.direccion.length > 0 ||
            !!dirNueva.referencia?.trim() ||
            dirNueva.latitud != null ||
            dirNueva.longitud != null
          const payload = {
            direccion: dirNueva.direccion,
            referencia: dirNueva.referencia || null,
            latitud: dirNueva.latitud ?? undefined,
            longitud: dirNueva.longitud ?? undefined,
          }
          if (tieneDatos) {
            if (dirExistente) {
              await clienteApi.actualizarDireccion(dirExistente.id, payload)
            } else {
              await clienteApi.crearDireccion(cliente.id, payload)
            }
          } else if (dirExistente && dirNueva.tipo !== TipoDireccion.D1) {
            // Vacía y existía → eliminar (excepto D1, siempre se conserva).
            await clienteApi.eliminarDireccion(dirExistente.id)
          }
        }
      } else {
        // MODO CREACIÓN: solo se persisten las que tengan dirección.
        for (const dirNueva of direccionesDesdeForm) {
          const tieneDatos =
            dirNueva.direccion.length > 0 ||
            !!dirNueva.referencia?.trim() ||
            dirNueva.latitud != null ||
            dirNueva.longitud != null
          if (!tieneDatos) continue
          await clienteApi.crearDireccion(cliente.id, {
            direccion: dirNueva.direccion,
            referencia: dirNueva.referencia || null,
            latitud: dirNueva.latitud ?? undefined,
            longitud: dirNueva.longitud ?? undefined,
          })
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
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.DIRECCIONES_CLIENTE, response.data.data.id],
        });
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.DIRECCION_CLIENTE],
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
