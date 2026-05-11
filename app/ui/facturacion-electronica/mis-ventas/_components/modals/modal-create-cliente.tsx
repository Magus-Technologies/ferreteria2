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

  // Función para cargar los datos del cliente y sus direcciones.
  // Extraída para poder re-usarla tanto en la apertura inicial como en re-aperturas.
  const cargarDatosCliente = async (clienteDataEdit: Cliente) => {
    // Usar setTimeout para asegurar que el formulario de Ant Design se haya montado y conectado
    // a la instancia creada por useForm antes de intentar resetear campos.
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      form.resetFields();
      
      // Transformar null a undefined para compatibilidad con Ant Design Form
      const formValues = Object.fromEntries(
        Object.entries(clienteDataEdit).map(([key, value]) => [
          key,
          value ?? undefined,
        ]),
      );
      form.setFieldsValue(formValues);

      // Convertir fecha_nacimiento string a Dayjs para el DatePicker
      if (clienteDataEdit.fecha_nacimiento) {
        form.setFieldValue('fecha_nacimiento', dayjs(clienteDataEdit.fecha_nacimiento));
      }

      // Cargar direcciones desde la tabla direcciones_cliente y
      // adjuntarlas al cliente — el hook `useDireccionesClienteForm`
      // dentro de FormCreateCliente las parsea automáticamente y
      // escribe los campos legacy del form (sin switch hardcoded).
      setCargandoDirecciones(true);
      try {
        const response = await clienteApi.listarDirecciones(clienteDataEdit.id);
        const direcciones = response.data?.data ?? [];
        setClienteConDirecciones({ ...clienteDataEdit, direcciones });
      } catch (error) {
        console.error('Error cargando direcciones:', error);
        setClienteConDirecciones(clienteDataEdit);
      } finally {
        setCargandoDirecciones(false);
        setDireccionesListas(true);
      }
    } catch (e) {
      // Si el formulario aún no está conectado, reintentar o ignorar
      console.warn('Formulario no conectado aún:', e);
      setDireccionesListas(true);
    }
  };

  useEffect(() => {
    if (!open) {
      setDireccionesListas(false);
      return;
    }

    // Siempre usar dataEdit fresco (props) para obtener los datos más recientes
    if (dataEdit) {
      cargarDatosCliente(dataEdit);
    } else {
      // Modo crear: reset completo
      setTimeout(() => {
        form.resetFields();
        form.setFieldsValue({
          numero_documento: textDefault,
        });
        setClienteConDirecciones(undefined);
        setDireccionesListas(true);
      }, 0);
    }
  }, [form, dataEdit, open, textDefault, cargarDatosCliente]);

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
      <FormCreateCliente form={form} dataEdit={clienteConDirecciones} direccionesListas={direccionesListas} />
    </ModalForm>
  );
}
