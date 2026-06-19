import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import dayjs from "dayjs";
import { type MutableRefObject } from "react";
import {
  clienteApi,
  TIPOS_DIRECCION_LIST,
  TipoCliente,
  TipoDireccion,
  type Cliente,
  type CreateClienteRequest,
  type DireccionCliente,
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
  direccionesRef,
}: {
  onSuccess?: (cliente: Cliente) => void;
  dataEdit?: Cliente;
  direccionesRef?: MutableRefObject<DireccionCliente[] | null>;
}) {
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const mutation = useMutation({
    // No reintentar: la mutation no es idempotente (crea/actualiza/elimina
    // direcciones). Un retry puede causar duplicados o "Dirección no encontrada".
    retry: 0,
    mutationFn: async (values: FormCreateClienteValues) => {
      // D1 (dirección) es obligatorio para RUC, opcional para DNI
      if (values.tipo_cliente === TipoCliente.EMPRESA) {
        const d1 = ((values as any).direccion ?? '').trim()
        if (!d1.length) {
          throw new Error('La dirección es obligatoria para clientes con RUC')
        }
      }

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

      // Cargar direcciones existentes para modo edición
      let direccionesExistentesMap: Map<TipoDireccion, DireccionCliente> | undefined
      if (dataEdit?.id) {
        // MODO EDICIÓN: comparar con las direcciones existentes y aplicar
        // create / update / delete por tipo.
        const direccionesExistentesResponse = await clienteApi.listarDirecciones(cliente.id);
        const direccionesExistentes = direccionesExistentesResponse.data?.data || [];
        direccionesExistentesMap = new Map(direccionesExistentes.map((d) => [d.tipo, d]))

        for (const dirNueva of direccionesDesdeForm) {
          const dirExistente = direccionesExistentesMap.get(dirNueva.tipo)
          // "Tiene datos" si alguno de los campos tiene contenido:
          // direccion, referencia, latitud o longitud.
          // Así, si el usuario borra solo el texto de la direccion pero
          // deja referencia o GPS, el registro se actualiza (no se borra).
          const tieneDatos =
            dirNueva.direccion.length > 0 ||
            (dirNueva.referencia != null && dirNueva.referencia.trim().length > 0) ||
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
              const res = await clienteApi.actualizarDireccion(dirExistente.id, payload)
              if (res.error) throw new Error(res.error.message)
            } else {
              const res = await clienteApi.crearDireccion(cliente.id, payload)
              if (res.error) throw new Error(res.error.message)
            }
          } else if (dirExistente) {
            // D1 es obligatorio para RUC — no eliminarla aunque esté vacía en el form
            if (values.tipo_cliente === TipoCliente.EMPRESA && dirNueva.tipo === TipoDireccion.D1) continue

            if (dirExistente.es_principal) {
              const otraDir = direccionesExistentes.find((d) => d.id !== dirExistente.id)
              if (otraDir) {
                // Reasignar principal a otra dirección y eliminar esta
                const res = await clienteApi.marcarDireccionPrincipal(otraDir.id)
                if (res.error) throw new Error(res.error.message)
                otraDir.es_principal = true
                dirExistente.es_principal = false
                const delRes = await clienteApi.eliminarDireccion(dirExistente.id)
                if (delRes.error) throw new Error(delRes.error.message)
              } else {
                // Es la única dirección — el backend no permite eliminarla.
                // La actualizamos con string vacío para limpiar los datos.
                // El backend (con nullable|string) acepta null y lo convierte a ''.
                const updRes = await clienteApi.actualizarDireccion(dirExistente.id, {
                  direccion: '',
                  referencia: null,
                  latitud: undefined,
                  longitud: undefined,
                })
                if (updRes.error) throw new Error(updRes.error.message)
              }
            } else {
              const delRes = await clienteApi.eliminarDireccion(dirExistente.id)
              if (delRes.error) throw new Error(delRes.error.message)
            }
          }
        }
      } else {
        // MODO CREACIÓN: solo se persisten las que tengan algún dato
        // (direccion, referencia o GPS).
        for (const dirNueva of direccionesDesdeForm) {
          const tieneDatos =
            dirNueva.direccion.length > 0 ||
            (dirNueva.referencia != null && dirNueva.referencia.trim().length > 0) ||
            dirNueva.latitud != null ||
            dirNueva.longitud != null
          if (!tieneDatos) continue
          const res = await clienteApi.crearDireccion(cliente.id, {
            direccion: dirNueva.direccion,
            referencia: dirNueva.referencia || null,
            latitud: dirNueva.latitud ?? undefined,
            longitud: dirNueva.longitud ?? undefined,
          })
          if (res.error) throw new Error(res.error.message)
        }
      }

      // Sincronizar es_principal: si el usuario cambió la dirección
      // principal via la estrella clickeable, el ref tiene el estado
      // actualizado. Llamamos marcarDireccionPrincipal si cambió.
      if (dataEdit?.id && direccionesRef?.current && direccionesExistentesMap) {
        const dirPrincipalNueva = direccionesRef.current.find(
          (d) => d.es_principal && d.direccion.length > 0,
        )
        const principalOriginal = [...direccionesExistentesMap.values()].find(
          (d) => d.es_principal,
        )
        if (dirPrincipalNueva) {
          const dirExistentePrincipal = direccionesExistentesMap.get(dirPrincipalNueva.tipo)
          if (
            dirExistentePrincipal &&
            dirExistentePrincipal.id !== principalOriginal?.id
          ) {
            const res = await clienteApi.marcarDireccionPrincipal(dirExistentePrincipal.id)
            if (res.error) throw new Error(res.error.message)
          }
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
