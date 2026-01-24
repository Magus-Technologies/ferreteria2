import { Tooltip, Form } from "antd";
import { useState } from "react";
import ModalForm from "~/components/modals/modal-form";
import TitleForm from "~/components/form/title-form";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import { MdDriveFileRenameOutline } from "react-icons/md";
import usePermissionHook from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import ButtonCreateFormWithName from "./button-create-form-with-name";
import useCreateCategoria from "~/hooks/use-create-categoria";
import type { Categoria } from "~/lib/api/catalogos";

interface ButtonCreateCategoriaProps {
  className?: string;
  onSuccess?: (res: Categoria) => void;
}

interface FormValues {
  name: string;
}

export default function ButtonCreateCategoria({
  className,
  onSuccess,
}: ButtonCreateCategoriaProps) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { can } = usePermissionHook();
  const { crearCategoria, loading } = useCreateCategoria({
    onSuccess: (categoria) => {
      setOpen(false);
      form.resetFields();
      onSuccess?.(categoria);
    },
  });

  if (!can(permissions.CATEGORIA_CREATE)) return null;

  const handleSubmit = (values: FormValues) => {
    crearCategoria(values.name);
  };

  return (
    <>
      <ModalForm
        modalProps={{
          title: <TitleForm>Categoría</TitleForm>,
          className: "w-[95vw] xl:w-auto xl:min-w-[400px]",
          wrapClassName: "!flex !items-center",
          centered: true,
          okButtonProps: { loading, disabled: loading },
          okText: "Crear",
        }}
        onCancel={() => {
          form.resetFields();
        }}
        open={open}
        setOpen={setOpen}
        formProps={{
          form,
          onFinish: handleSubmit,
        }}
      >
        <LabelBase label="Nombre:" orientation="column">
          <InputBase
            prefix={<MdDriveFileRenameOutline className="text-rose-700 mx-1" />}
            propsForm={{
              name: "name",
              rules: [
                {
                  required: true,
                  message: "Por favor, ingresa el nombre",
                },
                {
                  min: 2,
                  message: "El nombre debe tener al menos 2 caracteres",
                },
                {
                  max: 191,
                  message: "El nombre no puede tener más de 191 caracteres",
                },
              ],
            }}
            placeholder="Nombre de la categoría"
          />
        </LabelBase>
      </ModalForm>
      <Tooltip title="Crear Categoría">
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  );
}
