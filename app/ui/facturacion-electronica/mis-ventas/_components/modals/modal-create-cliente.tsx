import { TipoCliente, clienteApi } from "~/lib/api/cliente";
import { Form } from "antd";
import dayjs from "dayjs";
import TitleForm from "~/components/form/title-form";
import ModalForm from "~/components/modals/modal-form";
import useCreateCliente from "../../_hooks/use-create-cliente";
import FormCreateCliente from "../form/form-create-cliente";
import { useEffect, useState } from "react";
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
  // Cliente "completo" (con `direcciones[]` cargadas) que se le pasa al
  // form interno. El hook `useDireccionesClienteForm` que vive adentro
  // parsea automáticamente el array — este modal ya no necesita el switch
  // case D1/D2/D3/D4 que escribía 12 campos legacy uno por uno.
  const [clienteConDirecciones, setClienteConDirecciones] = useState<Cliente | undefined>(undefined);

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
      return;
    }

    setMapSessionKey((prev) => prev + 1);

    if (dataEdit) {
      const cargar = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        try {
          form.resetFields();
          const formValues = Object.fromEntries(
            Object.entries(dataEdit).map(([key, value]) => [key, value ?? undefined]),
          );
          form.setFieldsValue(formValues);
          // SelectEstado usa 1/0, el modelo usa boolean
          form.setFieldValue('estado', dataEdit.estado ? 1 : 0);
          // SelectEstado usa 1/0, el modelo usa boolean
          form.setFieldValue('estado', dataEdit.estado ? 1 : 0);
          if (dataEdit.fecha_nacimiento) {
            form.setFieldValue('fecha_nacimiento', dayjs(dataEdit.fecha_nacimiento));
          }
          setCargandoDirecciones(true);
          try {
            const response = await clienteApi.listarDirecciones(dataEdit.id);
            const direcciones = response.data?.data ?? [];
            setClienteConDirecciones({ ...dataEdit, direcciones });
          } catch {
            setClienteConDirecciones(dataEdit);
          } finally {
            setCargandoDirecciones(false);
            setDireccionesListas(true);
          }
        } catch {
          setDireccionesListas(true);
        }
      };
      cargar();
    } else {
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue({ numero_documento: textDefault });
        setClienteConDirecciones(undefined);
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
        onFinish: crearClienteForm,
      }}
    >
      <FormCreateCliente
        form={form}
        dataEdit={clienteConDirecciones}
        direccionesListas={direccionesListas}
        mapSessionKey={mapSessionKey}
      />
    </ModalForm>
  );
}
