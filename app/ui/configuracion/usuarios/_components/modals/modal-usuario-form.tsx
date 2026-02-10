"use client";

import { Form, message, Tabs, Input } from "antd";
import { useEffect, useState } from "react";
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
import SelectEstadoCivil from "~/app/_components/form/selects/select-estado-civil";
import SelectRolSistema from "~/app/_components/form/selects/select-rol-sistema";
import SelectCargo from "~/app/_components/form/selects/select-cargo";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import { usuariosApi, CreateUsuarioRequest, Usuario } from "~/lib/api/usuarios";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useAuth } from "~/lib/auth-context";
import dayjs, { Dayjs } from "dayjs";
import { consultaReniec } from "~/app/_actions/consulta-reniec";
import { ConsultaDni } from "~/app/_types/consulta-ruc";

// Tipo para el formulario que acepta Dayjs
interface UsuarioFormValues extends Omit<CreateUsuarioRequest, 'fecha_nacimiento' | 'fecha_inicio' | 'fecha_baja'> {
  fecha_nacimiento?: Dayjs | string;
  fecha_inicio?: Dayjs | string;
  fecha_baja?: Dayjs | string;
}

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
  const [form] = Form.useForm<UsuarioFormValues>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEdit = !!usuarioEdit;
  const [consultando, setConsultando] = useState(false);

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
        fecha_nacimiento: usuarioEdit.fecha_nacimiento ? dayjs(usuarioEdit.fecha_nacimiento) : undefined,
        // Información de Contrato
        rol_sistema: usuarioEdit.rol_sistema || undefined,
        cargo: usuarioEdit.cargo || undefined,
        fecha_inicio: usuarioEdit.fecha_inicio ? dayjs(usuarioEdit.fecha_inicio) : undefined,
        fecha_baja: usuarioEdit.fecha_baja ? dayjs(usuarioEdit.fecha_baja) : undefined,
        vacaciones_dias: usuarioEdit.vacaciones_dias || 15,
        sueldo_boleta: usuarioEdit.sueldo_boleta || undefined,
        estado: usuarioEdit.estado,
      });
    } else if (open && !usuarioEdit) {
      // Al crear, usar la empresa del usuario actual
      form.setFieldsValue({
        empresa_id: user?.empresa?.id || 1,
        tipo_documento: "DNI",
        nacionalidad: "PERUANA",
        vacaciones_dias: 15,
        estado: true,
      });
    } else if (!open) {
      form.resetFields();
    }
  }, [open, usuarioEdit, form, user]);

  const handleSubmit = async (values: any) => {
    // Convertir fechas a formato YYYY-MM-DD si existen
    const dataToSend: CreateUsuarioRequest = {
      ...values,
      fecha_nacimiento: values.fecha_nacimiento
        ? typeof values.fecha_nacimiento === "string"
          ? values.fecha_nacimiento
          : dayjs(values.fecha_nacimiento).format("YYYY-MM-DD")
        : undefined,
      fecha_inicio: values.fecha_inicio
        ? typeof values.fecha_inicio === "string"
          ? values.fecha_inicio
          : dayjs(values.fecha_inicio).format("YYYY-MM-DD")
        : undefined,
      fecha_baja: values.fecha_baja
        ? typeof values.fecha_baja === "string"
          ? values.fecha_baja
          : dayjs(values.fecha_baja).format("YYYY-MM-DD")
        : undefined,
    };

    if (isEdit && usuarioEdit) {
      updateMutation.mutate({ id: usuarioEdit.id, data: dataToSend });
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  // Función para autocompletar datos desde RENIEC/SUNAT
  const handleDocumentoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const documento = e.target.value.trim();
    const tipoDocumento = form.getFieldValue('tipo_documento');

    // DNI: 8 dígitos
    if (tipoDocumento === 'DNI' && documento.length === 8 && /^\d{8}$/.test(documento)) {
      try {
        setConsultando(true);
        const response = await consultaReniec({ search: documento });

        if (response.data) {
          const data = response.data as ConsultaDni;
          
          // Completar nombre completo
          const nombreCompleto = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`;
          form.setFieldsValue({
            name: nombreCompleto,
          });
          
          message.success('Datos obtenidos de RENIEC');
        } else {
          message.warning('No se encontraron datos para este DNI');
        }
      } catch (error) {
        console.error('Error consultando DNI:', error);
        message.error('Error al consultar DNI');
      } finally {
        setConsultando(false);
      }
    }
    
    // RUC: 11 dígitos
    if (tipoDocumento === 'RUC' && documento.length === 11 && /^\d{11}$/.test(documento)) {
      try {
        setConsultando(true);
        const response = await consultaReniec({ search: documento });

        if (response.data) {
          const data = response.data as any; // ConsultaRuc
          
          form.setFieldsValue({
            name: data.razonSocial || '',
            direccion_linea1: data.direccion || '',
            telefono: data.telefonos?.[0] || '',
          });
          
          message.success('Datos obtenidos de SUNAT');
        } else {
          message.warning('No se encontraron datos para este RUC');
        }
      } catch (error) {
        console.error('Error consultando RUC:', error);
        message.error('Error al consultar RUC');
      } finally {
        setConsultando(false);
      }
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending || consultando;

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
                  onChange={handleDocumentoChange}
                  maxLength={11}
                  disabled={consultando}
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
                <SelectEstadoCivil
                  propsForm={{ name: "estado_civil" }}
                  placeholder="Seleccionar estado civil"
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

              {/* Contraseña de Supervisor (opcional) */}
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  🔐 Contraseña de Supervisor (Opcional)
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Si este usuario supervisará cierres de caja, asigna una contraseña de supervisor. 
                  Esta contraseña se usará para validar y aprobar cierres de caja de otros vendedores.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <LabelBase label="Contraseña de Supervisor:" orientation="column">
                      <Form.Item
                        name="supervisor_password"
                        rules={[
                          { min: 6, message: "Mínimo 6 caracteres" },
                        ]}
                        hasFeedback
                        className="w-full"
                      >
                        <Input.Password
                          placeholder="Contraseña de supervisor (opcional)"
                          prefix={
                            <FaLock size={14} className="text-amber-600 mx-1" />
                          }
                          variant="filled"
                          autoComplete="new-password"
                        />
                      </Form.Item>
                    </LabelBase>
                  </div>
                  <div>
                    <LabelBase
                      label="Confirmar Contraseña de Supervisor:"
                      orientation="column"
                    >
                      <Form.Item
                        name="supervisor_password_confirmation"
                        dependencies={["supervisor_password"]}
                        rules={[
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const supervisorPassword = getFieldValue("supervisor_password");
                              // Solo validar si se ingresó una contraseña de supervisor
                              if (!supervisorPassword) {
                                return Promise.resolve();
                              }
                              if (!value) {
                                return Promise.reject(
                                  new Error("Confirma la contraseña de supervisor")
                                );
                              }
                              if (supervisorPassword === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("Las contraseñas de supervisor no coinciden")
                              );
                            },
                          }),
                        ]}
                        hasFeedback
                        className="w-full"
                      >
                        <Input.Password
                          placeholder="Confirmar contraseña de supervisor"
                          prefix={
                            <FaLock size={14} className="text-amber-600 mx-1" />
                          }
                          variant="filled"
                          autoComplete="new-password"
                        />
                      </Form.Item>
                    </LabelBase>
                  </div>
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
          {/* Fila 1: Rol del Sistema y Cargo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <LabelBase label="Rol del Sistema: *" orientation="column">
                <SelectRolSistema
                  propsForm={{
                    name: "rol_sistema",
                    rules: [
                      { required: true, message: "Selecciona el rol del sistema" },
                    ],
                  }}
                  placeholder="Seleccionar rol"
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Cargo u Ocupación: *" orientation="column">
                <SelectCargo
                  propsForm={{
                    name: "cargo",
                    rules: [
                      { required: true, message: "Selecciona el cargo" },
                    ],
                  }}
                  placeholder="Seleccionar cargo"
                />
              </LabelBase>
            </div>
          </div>

          {/* Fila 2: Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <LabelBase label="Fecha de Inicio:" orientation="column">
                <DatePickerBase
                  propsForm={{ name: "fecha_inicio" }}
                  placeholder="DD/MM/AAAA"
                  prefix={
                    <FaCalendar size={14} className="text-blue-600 mx-1" />
                  }
                  format="DD/MM/YYYY"
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Fecha de Baja:" orientation="column">
                <DatePickerBase
                  propsForm={{ name: "fecha_baja" }}
                  placeholder="DD/MM/AAAA"
                  prefix={
                    <FaCalendar size={14} className="text-blue-600 mx-1" />
                  }
                  format="DD/MM/YYYY"
                />
              </LabelBase>
            </div>
          </div>

          {/* Fila 3: Vacaciones y Sueldo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <LabelBase label="Vacaciones (días):" orientation="column">
                <InputBase
                  propsForm={{ name: "vacaciones_dias" }}
                  placeholder="15"
                  type="number"
                  min={0}
                />
              </LabelBase>
            </div>
            <div>
              <LabelBase label="Sueldo en Boleta:" orientation="column">
                <InputBase
                  propsForm={{ name: "sueldo_boleta" }}
                  placeholder="0.00"
                  type="number"
                  min={0}
                  step="0.01"
                />
              </LabelBase>
            </div>
          </div>

          {/* Contraseña de Supervisor (al editar) */}
          {isEdit && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                🔐 Actualizar Contraseña de Supervisor (Opcional)
              </p>
              <p className="text-xs text-amber-700 mb-3">
                Si deseas cambiar o asignar una contraseña de supervisor, ingrésala aquí. 
                Déjalo en blanco si no deseas modificarla.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <LabelBase label="Nueva Contraseña de Supervisor:" orientation="column">
                    <Form.Item
                      name="supervisor_password"
                      rules={[
                        { min: 6, message: "Mínimo 6 caracteres" },
                      ]}
                      hasFeedback
                      className="w-full"
                    >
                      <Input.Password
                        placeholder="Nueva contraseña de supervisor (opcional)"
                        prefix={
                          <FaLock size={14} className="text-amber-600 mx-1" />
                        }
                        variant="filled"
                        autoComplete="new-password"
                      />
                    </Form.Item>
                  </LabelBase>
                </div>
                <div>
                  <LabelBase
                    label="Confirmar Contraseña de Supervisor:"
                    orientation="column"
                  >
                    <Form.Item
                      name="supervisor_password_confirmation"
                      dependencies={["supervisor_password"]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const supervisorPassword = getFieldValue("supervisor_password");
                            if (!supervisorPassword) {
                              return Promise.resolve();
                            }
                            if (!value) {
                              return Promise.reject(
                                new Error("Confirma la contraseña de supervisor")
                              );
                            }
                            if (supervisorPassword === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Las contraseñas de supervisor no coinciden")
                            );
                          },
                        }),
                      ]}
                      hasFeedback
                      className="w-full"
                    >
                      <Input.Password
                        placeholder="Confirmar contraseña de supervisor"
                        prefix={
                          <FaLock size={14} className="text-amber-600 mx-1" />
                        }
                        variant="filled"
                        autoComplete="new-password"
                      />
                    </Form.Item>
                  </LabelBase>
                </div>
              </div>
            </div>
          )}
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
