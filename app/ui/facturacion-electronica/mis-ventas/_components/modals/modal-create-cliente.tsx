import { TipoCliente } from "~/lib/api/cliente";
import { Form } from "antd";
import TitleForm from "~/components/form/title-form";
import ModalForm from "~/components/modals/modal-form";
import useCreateCliente from "../../_hooks/use-create-cliente";
import FormCreateCliente from "../form/form-create-cliente";
import { useEffect } from "react";
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
    } else {
      form.setFieldsValue({
        numero_documento: textDefault,
      });
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
        className: "min-w-[550px]",
        wrapClassName: "!flex !items-center",
        centered: true,
        okButtonProps: { loading, disabled: loading },
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
