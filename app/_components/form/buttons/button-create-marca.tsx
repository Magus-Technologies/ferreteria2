import { Tooltip, Form } from "antd";
import { useState } from "react";
import ModalForm from "~/components/modals/modal-form";
import InputBase from "~/app/_components/form/inputs/input-base";
import { MdDriveFileRenameOutline } from "react-icons/md";
import usePermissionHook from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import ButtonCreateFormWithName from "./button-create-form-with-name";
import useCreateMarca from "~/hooks/use-create-marca";
import { Marca } from "~/lib/api/catalogos";

interface FormValues {
  name: string;
}

interface ButtonCreateMarcaProps {
  className?: string;
  onSuccess?: (res: Marca) => void;
}

export default function ButtonCreateMarca({
  className,
  onSuccess,
}: ButtonCreateMarcaProps) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { can } = usePermissionHook();
  const { crearMarca, loading } = useCreateMarca({
    onSuccess: (marca) => {
      setOpen(false);
      form.resetFields();
      onSuccess?.(marca);
    },
  });

  if (!can(permissions.MARCA_CREATE)) return null;

  const handleSubmit = (values: FormValues) => {
    crearMarca(values.name);
  };

  return (
    <>
      <ModalForm
        open={open}
        setOpen={setOpen}
        modalProps={{
          title: "Crear Marca",
          width: 400,
          confirmLoading: loading,
        }}
        formProps={{
          form,
          onFinish: handleSubmit,
        }}
      >
        <Form.Item
          name="name"
          label="Nombre"
          rules={[{ required: true, message: 'Por favor ingrese el nombre de la marca' }]}
        >
          <InputBase
            placeholder="Ingrese nombre de la marca"
            prefix={<MdDriveFileRenameOutline className="text-gray-400" />}
            maxLength={191}
            showCount
          />
        </Form.Item>
      </ModalForm>

      <Tooltip title="Crear Marca">
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  );
}
