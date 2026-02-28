import { TipoCliente, clienteApi } from "~/lib/api/cliente";
import { Form } from "antd";
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

export interface FormCreateClienteValues {
  tipo_cliente: TipoCliente;
  numero_documento: string;
  razon_social: string;
  nombres: string;
  apellidos: string;
  direccion?: string | null;
  direccion_2?: string | null;
  direccion_3?: string | null;
  direccion_4?: string | null;
  latitud_d1?: number | null;
  longitud_d1?: number | null;
  latitud_d2?: number | null;
  longitud_d2?: number | null;
  latitud_d3?: number | null;
  longitud_d3?: number | null;
  latitud_d4?: number | null;
  longitud_d4?: number | null;
  telefono?: string | null;
  email?: string | null;
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
    const cargarDatos = async () => {
      form.resetFields();
      
      if (dataEdit) {
        // Transformar null a undefined para compatibilidad con Ant Design Form
        const formValues = Object.fromEntries(
          Object.entries(dataEdit).map(([key, value]) => [
            key,
            value ?? undefined,
          ]),
        );
        form.setFieldsValue(formValues);

        // Cargar direcciones desde la tabla direcciones_cliente
        setCargandoDirecciones(true);
        try {
          const response = await clienteApi.listarDirecciones(dataEdit.id);
          if (response.data?.data) {
            const direcciones = response.data.data;
            
            // Mapear las direcciones a los campos del formulario
            direcciones.forEach((dir) => {
              switch (dir.tipo) {
                case 'D1':
                  form.setFieldValue('direccion', dir.direccion);
                  form.setFieldValue('latitud_d1', dir.latitud);
                  form.setFieldValue('longitud_d1', dir.longitud);
                  break;
                case 'D2':
                  form.setFieldValue('direccion_2', dir.direccion);
                  form.setFieldValue('latitud_d2', dir.latitud);
                  form.setFieldValue('longitud_d2', dir.longitud);
                  break;
                case 'D3':
                  form.setFieldValue('direccion_3', dir.direccion);
                  form.setFieldValue('latitud_d3', dir.latitud);
                  form.setFieldValue('longitud_d3', dir.longitud);
                  break;
                case 'D4':
                  form.setFieldValue('direccion_4', dir.direccion);
                  form.setFieldValue('latitud_d4', dir.latitud);
                  form.setFieldValue('longitud_d4', dir.longitud);
                  break;
              }
            });
          }
        } catch (error) {
          console.error('Error cargando direcciones:', error);
        } finally {
          setCargandoDirecciones(false);
        }
      } else {
        form.setFieldsValue({
          numero_documento: textDefault,
        });
      }
    };

    if (open) {
      cargarDatos();
    }
  }, [form, dataEdit, open, textDefault]);

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
      <FormCreateCliente form={form} dataEdit={dataEdit} />
    </ModalForm>
  );
}
