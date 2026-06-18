import { TipoCliente, TipoDireccion, DireccionCliente, clienteApi } from "~/lib/api/cliente";
import { Form } from "antd";
import dayjs from "dayjs";
import TitleForm from "~/components/form/title-form";
import ModalForm from "~/components/modals/modal-form";
import useCreateCliente from "../../_hooks/use-create-cliente";
import FormCreateCliente from "../form/form-create-cliente";
import { useEffect, useRef, useState } from "react";
import type { Cliente } from "~/lib/api/cliente";

interface ModalCreateClienteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: (res: Cliente) => void;
  dataEdit?: Cliente;
  textDefault?: string;
  setTextDefault?: (text: string) => void;
}

/**
 * Valores del form de crear/editar cliente. Los campos legacy de
 * direcciones (`direccion`, `direccion_2..4`, `referencia_d1..4`,
 * `latitud_d1..4`, `longitud_d1..4`) los maneja `useDireccionesClienteForm`
 * internamente — el hook los escribe al form via `setFieldValue` cuando
 * el state interno cambia, y el form los expone al `crearClienteForm`
 * (use-create-cliente) sin que el modal tenga que mapearlos manualmente.
 */
export interface FormCreateClienteValues {
  tipo_cliente: TipoCliente;
  numero_documento: string;
  razon_social: string;
  nombres: string;
  apellidos: string;
  // Solo conservamos `direccion` (D1) en el tipo público porque algunos
  // consumidores antiguos la leen — los demás campos vienen del form
  // pero no necesitan estar en este interface (son detalles internos).
  direccion?: string | null;
  telefono?: string | null;
  celular?: string | null;
  profesion_id?: number | null;
  email?: string | null;
  fecha_nacimiento?: string | null;
  estado?: boolean | number;
}

export default function ModalCreateCliente({
  open,
  setOpen,
  onSuccess,
  dataEdit,
  textDefault,
  setTextDefault,
}: ModalCreateClienteProps) {
  const [form] = Form.useForm<FormCreateClienteValues>();
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false);
  const [direccionesListas, setDireccionesListas] = useState(false);
  const [mapSessionKey, setMapSessionKey] = useState(0);
  const cargaActualRef = useRef(0);
  // Cliente "completo" (con `direcciones[]` cargadas) que se le pasa al
  // form interno. El hook `useDireccionesClienteForm` que vive adentro
  // parsea automáticamente el array — este modal ya no necesita el switch
  // case D1/D2/D3/D4 que escribía 12 campos legacy uno por uno.
  const [clienteConDirecciones, setClienteConDirecciones] = useState<Cliente | undefined>(undefined);

  // Ref que FormCreateCliente sincroniza en cada render con el estado
  // actual del hook useDireccionesClienteForm. Se usa en onFinish para
  // sobreescribir los valores del form con el estado real del hook.
  const direccionesRef = useRef<DireccionCliente[] | null>(null);

  const { crearClienteForm, loading } = useCreateCliente({
    onSuccess: (cliente) => {
      // IMPORTANTE: Retrasar el cierre del modal para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setOpen(false);
        form.resetFields();
        onSuccess?.(cliente);
      }, 800); // 800ms es suficiente para ver el mensaje
    },
    dataEdit,
  });

  useEffect(() => {
    if (!open) {
      setDireccionesListas(false);
      setCargandoDirecciones(false);
      setClienteConDirecciones(undefined);
      return;
    }

    const cargaId = ++cargaActualRef.current;
    setMapSessionKey((prev) => prev + 1);
    setDireccionesListas(false);

    if (dataEdit) {
      const cargar = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        try {
          if (cargaActualRef.current !== cargaId) return;
          form.resetFields();
          setClienteConDirecciones(undefined);
          setCargandoDirecciones(true);

          const [clienteResponse, direccionesResponse] = await Promise.all([
            clienteApi.getById(dataEdit.id),
            clienteApi.listarDirecciones(dataEdit.id),
          ]);

          if (cargaActualRef.current !== cargaId) return;

          const clienteCompleto = clienteResponse.data?.data ?? dataEdit;
          const direcciones = direccionesResponse.data?.data ?? [];

          const formValues = Object.fromEntries(
            Object.entries(clienteCompleto).map(([key, value]) => [key, value ?? undefined]),
          );
          form.setFieldsValue(formValues);
          // SelectEstado usa 1/0, el modelo usa boolean
          form.setFieldValue('estado', clienteCompleto.estado ? 1 : 0);
          if (clienteCompleto.fecha_nacimiento) {
            form.setFieldValue('fecha_nacimiento', dayjs(clienteCompleto.fecha_nacimiento));
          }
          setClienteConDirecciones({ ...clienteCompleto, direcciones });
          setCargandoDirecciones(false);
          setDireccionesListas(true);
        } catch {
          if (cargaActualRef.current !== cargaId) return;
          const formValues = Object.fromEntries(
            Object.entries(dataEdit).map(([key, value]) => [key, value ?? undefined]),
          );
          form.setFieldsValue(formValues);
          form.setFieldValue('estado', dataEdit.estado ? 1 : 0);
          if (dataEdit.fecha_nacimiento) {
            form.setFieldValue('fecha_nacimiento', dayjs(dataEdit.fecha_nacimiento));
          }
          setClienteConDirecciones(dataEdit);
          setCargandoDirecciones(false);
          setDireccionesListas(true);
        }
      };
      cargar();
    } else {
      setTimeout(() => {
        if (cargaActualRef.current !== cargaId) return;
        form.resetFields();
        form.setFieldsValue({ numero_documento: textDefault });
        setClienteConDirecciones(undefined);
        setCargandoDirecciones(false);
        setDireccionesListas(true);
      }, 0);
    }
  }, [open, dataEdit?.id, textDefault, form]);

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className="!pb-0">
            {dataEdit ? "Editar" : "Crear"} Cliente
          </TitleForm>
        ),
        className: "min-w-[900px]",
        wrapClassName: "!flex !items-center",
        centered: true,
        okButtonProps: { loading: loading || cargandoDirecciones, disabled: loading || cargandoDirecciones },
        okText: dataEdit ? "Editar" : "Crear",
      }}
      onCancel={() => {
        form.resetFields();
        setTextDefault?.("");
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: (values) => {
          const direcciones = direccionesRef.current
          if (direcciones?.length) {
            const override: Record<string, string | null | undefined> = {}
            for (const d of direcciones) {
              const key =
                d.tipo === TipoDireccion.D1 ? 'direccion'
                : d.tipo === TipoDireccion.D2 ? 'direccion_2'
                : d.tipo === TipoDireccion.D3 ? 'direccion_3'
                : d.tipo === TipoDireccion.D4 ? 'direccion_4'
                : undefined
              if (key) override[key] = d.direccion || ''
            }
            crearClienteForm({ ...values, ...override })
          } else {
            crearClienteForm(values)
          }
        },
      }}
    >
      <FormCreateCliente
        form={form}
        dataEdit={clienteConDirecciones}
        direccionesListas={direccionesListas}
        mapSessionKey={mapSessionKey}
        direccionesRef={direccionesRef}
      />
    </ModalForm>
  );
}
