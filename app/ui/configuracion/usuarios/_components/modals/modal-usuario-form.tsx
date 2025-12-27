"use client";

import { Form, message, Tabs, Input } from "antd";
import { useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaCalendar,
} from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ModalForm from "~/components/modals/modal-form";
import TitleForm from "~/components/form/title-form";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectBase from "~/app/_components/form/selects/select-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import { usuariosApi, CreateUsuarioRequest, Usuario } from "~/lib/api/usuarios";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useAuth } from "~/lib/auth-context";
import dayjs from "dayjs";

interface ModalUsuarioFormProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  usuarioEdit?: Usuario | null;
  onSuccess?: () => void;
}

export default function ModalUsuarioForm({
  open,
  setOpen,
  usuarioEdit,
  onSuccess,
}: ModalUsuarioFormProps) {
  const [form] = Form.useForm<CreateUsuarioRequest>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEdit = !!usuarioEdit;

  // Mutación para crear
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioRequest) => usuariosApi.create(data),
    onSuccess: (response) => {
      if (response.data) {
        message.success("Usuario creado exitosamente");
        queryClient.invalidateQueries({ queryKey: [QueryKeys.USUARIOS] });
        setOpen(false);
        form.resetFields();
        onSuccess?.();
      } else if (response.error) {
        message.error(response.error.message);
      }
    },
    onError: () => {
      message.error("Error al crear usuario");
    },
  });

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateUsuarioRequest }) =>
      usuariosApi.update(id, data),
    onSuccess: (response) => {
      if (response.data) {
        message.success("Usuario actualizado exitosamente");
        queryClient.invalidateQueries({ queryKey: [QueryKeys.USUARIOS] });
        setOpen(false);
        form.resetFields();
        onSuccess?.();
      } else if (response.error) {
        message.error(response.error.message);
      }
    },
    onError: () => {
      message.error("Error al actualizar usuario");
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (open && usuarioEdit) {
      form.setFieldsValue({
        name: usuarioEdit.name,
        email: usuarioEdit.email,
        empresa_id: usuarioEdit.empresa_id,
        efectivo: usuarioEdit.efectivo,
        tipo_documento: usuarioEdit.tipo_documento || "DNI",
        numero_documento: usuarioEdit.numero_documento || undefined,
        telefono: usuarioEdit.telefono || undefined,
        celular: usuarioEdit.celular || undefined,
        genero: usuarioEdit.genero || undefined,
        estado_civil: usuarioEdit.estado_civil || undefined,
        email_corporativo: usuarioEdit.email_corporativo || undefined,
        direccion_linea1: usuarioEdit.direccion_linea1 || undefined,
        direccion_linea2: usuarioEdit.direccion_linea2 || undefined,
        ciudad: usuarioEdit.ciudad || undefined,
        nacionalidad: usuarioEdit.nacionalidad || "PERUANA",
        fecha_nacimiento: usuarioEdit.fecha_nacimiento || undefined,
        estado: usuarioEdit.estado,
      });
    } else if (open && !usuarioEdit) {
      // Al crear, usar la empresa del usuario actual
      form.setFieldsValue({
        empresa_id: user?.empresa?.id || 1,
        tipo_documento: "DNI",
        nacionalidad: "PERUANA",
        estado: true,
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, usuarioEdit, form, user]);

  const handleSubmit = async (values: any) => {
    // Convertir fecha a formato YYYY-MM-DD si existe
    const dataToSend: CreateUsuarioRequest = {
      ...values,
      fecha_nacimiento: values.fecha_nacimiento
        ? typeof values.fecha_nacimiento === "string"
          ? values.fecha_nacimiento
          : dayjs(values.fecha_nacimiento).format("YYYY-MM-DD")
        : undefined,
    };

    if (isEdit && usuarioEdit) {
      updateMutation.mutate({ id: usuarioEdit.id, data: dataToSend });
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending;

  // Tabs para organizar la información
  const tabItems = [
    {
      key: "1",
      label: "Información Personal",
      children: (
        <div className="space-y-2">
          {/* Fila 1: Tipo y Número de Documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <LabelBase label="Tipo documento: *" orientation="column">
                <SelectBase
                  propsForm={{
                    name: "tipo_documento",
                    rules: [
                      {
                        required: true,
                        message: "Selecciona el tipo de documento",
                      },
                    ],
                  }}
                  placeholder="Seleccionar"
                  options={[
                    { value: "DNI", label: "DNI" },
                    { value: "RUC", label: "RUC" },
                    { value: "CE", label: "CE" },
                    { value: "PASAPORTE", label: "PASAPORTE" },
                  ]}
                />
              </LabelBase>
            </div>

            <div>
              <LabelBase label="Número documento: *" orientation="column">
                <InputBase
                  propsForm={{
                    name: "numero_documento",
                    rules: [
                      {
                        required: true,
                        message: "Ingresa el número de documento",
                      },
                    ],
                  }}
                  placeholder="Número de documento"
                  prefix={<FaIdCard size={14} className="text-blue-600 mx-1" />}
                />
              </LabelBase>
            </div>
          </div>

          {/* Fila 2: Nombres Completos, telefono y celular  */}
          <div className="grid grid-cols-1 md:grid:cols-2 lg:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <LabelBase label="Nombres Completos: *" orientation="column">
                <InputBase
                  propsForm={{
                    name: "name",
                    rules: [
                      { required: true, message: "Ingresa el nombre completo" },
                    ],
                  }}
                  placeholder="Nombres Completos"
                  prefix={<FaUser size={14} className="text-blue-600 mx-1" />}
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Teléfono:" orientation="column">
                <InputBase
                  propsForm={{ name: "telefono" }}
                  placeholder="Teléfono"
                  prefix={<FaPhone size={14} className="text-blue-600 mx-1" />}
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Celular: *" orientation="column">
                <InputBase
                  propsForm={{
                    name: "celular",
                    rules: [{ required: true, message: "Ingresa el celular" }],
                  }}
                  placeholder="Celular"
                  prefix={<FaPhone size={14} className="text-blue-600 mx-1" />}
                />
              </LabelBase>
            </div>
          </div>

          {/* Fila 3: Teléfono y Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <LabelBase label="Género:" orientation="column">
                <SelectBase
                  propsForm={{ name: "genero" }}
                  placeholder="Seleccionar"
                  options={[
                    { value: "M", label: "Masculino" },
                    { value: "F", label: "Femenino" },
                    { value: "O", label: "Otro" },
                  ]}
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Estado Civil:" orientation="column">
                <SelectBase
                  propsForm={{ name: "estado_civil" }}
                  placeholder="Seleccionar"
                  options={[
                    { value: "SOLTERO", label: "Soltero" },
                    { value: "CASADO", label: "Casado" },
                    { value: "DIVORCIADO", label: "Divorciado" },
                    { value: "VIUDO", label: "Viudo" },
                    { value: "CONVIVIENTE", label: "Conviviente" },
                  ]}
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Email: *" orientation="column">
                <InputBase
                  propsForm={{
                    name: "email",
                    rules: [
                      { required: true, message: "Ingresa el email" },
                      { type: "email", message: "Email inválido" },
                    ],
                  }}
                  placeholder="correo@ejemplo.com"
                  prefix={
                    <FaEnvelope size={14} className="text-blue-600 mx-1" />
                  }
                  uppercase={false}
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Email Corporativo:" orientation="column">
                <InputBase
                  propsForm={{
                    name: "email_corporativo",
                    rules: [{ type: "email", message: "Email inválido" }],
                  }}
                  placeholder="corporativo@empresa.com"
                  prefix={
                    <FaEnvelope size={14} className="text-blue-600 mx-1" />
                  }
                  uppercase={false}
                />
              </LabelBase>
            </div>
          </div>

          {/* Fila 4: direccion linea 1 y dirrecion linea 2*/}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <LabelBase label="Dirección Línea 1:" orientation="column">
                <InputBase
                  propsForm={{ name: "direccion_linea1" }}
                  placeholder="Dirección Línea 1"
                  prefix={
                    <FaMapMarkerAlt size={14} className="text-blue-600 mx-1" />
                  }
                />
              </LabelBase>
            </div>
            <div className="lg:col-span-2">
              <LabelBase label="Dirección Línea 2:" orientation="column">
                <InputBase
                  propsForm={{ name: "direccion_linea2" }}
                  placeholder="Dirección Línea 2"
                  prefix={
                    <FaMapMarkerAlt size={14} className="text-blue-600 mx-1" />
                  }
                />
              </LabelBase>
            </div>
          </div>

          {/* Fila 5: Ciudad, Nacionalidad, Fecha Nacimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <LabelBase label="Ciudad:" orientation="column">
                <InputBase
                  propsForm={{ name: "ciudad" }}
                  placeholder="Ciudad"
                />
              </LabelBase>
            </div>
            {/* Nacionalidad */}
            <div>
              <LabelBase label="Nacionalidad:" orientation="column">
                <InputBase
                  propsForm={{ name: "nacionalidad" }}
                  placeholder="Nacionalidad"
                />
              </LabelBase>
            </div>

            {/* Fecha Nacimiento */}
            <div>
              <LabelBase label="Fecha Nacimiento:" orientation="column">
                <DatePickerBase
                  propsForm={{ name: "fecha_nacimiento" }}
                  placeholder="DD/MM/AAAA"
                  prefix={
                    <FaCalendar size={14} className="text-blue-600 mx-1" />
                  }
                  format="DD/MM/YYYY"
                />
              </LabelBase>
            </div>
          </div>

          {/* Contraseña (solo al crear) */}
          {!isEdit && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <LabelBase label="Contraseña: *" orientation="column">
                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: "Ingresa la contraseña" },
                        { min: 6, message: "Mínimo 6 caracteres" },
                      ]}
                      hasFeedback
                      className="w-full"
                    >
                      <Input.Password
                        placeholder="Contraseña"
                        prefix={
                          <FaLock size={14} className="text-blue-600 mx-1" />
                        }
                        variant="filled"
                        autoComplete="new-password"
                      />
                    </Form.Item>
                  </LabelBase>
                </div>
                <div className="lg:col-span-2">
                  <LabelBase
                    label="Confirmar Contraseña: *"
                    orientation="column"
                  >
                    <Form.Item
                      name="password_confirmation"
                      dependencies={["password"]}
                      rules={[
                        { required: true, message: "Confirma la contraseña" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("password") === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Las contraseñas no coinciden")
                            );
                          },
                        }),
                      ]}
                      hasFeedback
                      className="w-full"
                    >
                      <Input.Password
                        placeholder="Confirmar Contraseña"
                        prefix={
                          <FaLock size={14} className="text-blue-600 mx-1" />
                        }
                        variant="filled"
                        autoComplete="new-password"
                      />
                    </Form.Item>
                  </LabelBase>
                </div>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: "2",
      label: "Información de Contrato",
      children: (
        <div className="space-y-3">
          <div className="text-center text-gray-500 py-8">
            <p>Información de contrato próximamente...</p>
            <p className="text-sm mt-2">
              Aquí puedes agregar campos como cargo, fecha de ingreso, salario,
              etc.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm>
            {isEdit ? "Modificar Empleado" : "Crear Usuario"}
          </TitleForm>
        ),
        okText: isEdit ? "Guardar" : "Crear",
        okButtonProps: { loading, disabled: loading },
        width: 900,
        centered: true,
        focusTriggerAfterClose: false,
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
        layout: "vertical",
        autoComplete: "off",
      }}
    >
      {/* Campos ocultos */}
      <Form.Item name="empresa_id" hidden>
        <InputBase />
      </Form.Item>
      <Form.Item name="efectivo" hidden initialValue={0}>
        <InputBase />
      </Form.Item>
      <Form.Item name="estado" hidden initialValue={true}>
        <InputBase />
      </Form.Item>

      {/* Tabs */}
      <Tabs items={tabItems} />
    </ModalForm>
  );
}
