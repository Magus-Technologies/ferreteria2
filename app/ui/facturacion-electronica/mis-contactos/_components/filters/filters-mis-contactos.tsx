"use client";

import { Form } from "antd";
import { FaSearch } from "react-icons/fa";
import { IoMdContact } from "react-icons/io";
import { TipoCliente } from "~/lib/api/cliente";
import { useStoreFiltrosMisContactos } from "../../_store/store-filtros-mis-contactos";
import ButtonCreateCliente from "~/app/_components/form/buttons/button-create-cliente";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectTipoCliente from "~/app/_components/form/selects/select-tipo-cliente";

interface ValuesFiltersMisContactos {
  search?: string;
  tipo_cliente?: TipoCliente;
  estado?: boolean;
}

export default function FiltersMisContactos() {
  const [form] = Form.useForm<ValuesFiltersMisContactos>();
  const { setFiltros, limpiarFiltros } = useStoreFiltrosMisContactos();

  const handleFinish = (values: ValuesFiltersMisContactos) => {
    // Limpiar valores undefined, null o vacíos
    const data: any = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        data[key] = value;
      }
    });

    setFiltros(data);
  };

  const handleLimpiar = () => {
    form.resetFields();
    limpiarFiltros();
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-contactos"
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Contactos"
        icon={<IoMdContact className="text-cyan-600" />}
      />

      {/* Filtros Desktop */}
      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-2 gap-y-2 items-center">
          {/* Buscar */}
          <div className="col-span-4 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Buscar:
            </label>
            <InputBase
              propsForm={{
                name: "search",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="RUC/DNI, Razón Social, Nombres..."
              formWithMessage={false}
              className="h-10"
            />
          </div>

          {/* Tipo */}
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tipo:
            </label>
            <SelectTipoCliente
              propsForm={{
                name: "tipo_cliente",
                hasFeedback: false,
                className: "!w-full",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>

          {/* Estado */}
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado:
            </label>
            <Form.Item name="estado" noStyle>
              <select 
                className="w-full h-10 px-2 border border-gray-300 rounded-md text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                onChange={(e) => {
                  const value = e.target.value;
                  form.setFieldValue("estado", value === "" ? undefined : value === "true");
                }}
              >
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Form.Item>
          </div>

          {/* Botón Buscar */}
          <div className="col-span-1 flex items-center">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2 w-full justify-center h-10"
            >
              <FaSearch />
              Buscar
            </ButtonBase>
          </div>

          {/* Botón Limpiar y Crear Cliente */}
          <div className="col-span-1 flex items-center gap-2">
            <ButtonBase
              color="default"
              size="md"
              type="button"
              onClick={handleLimpiar}
              className="flex items-center gap-1 justify-center h-10"
            >
              Limpiar
            </ButtonBase>
            <ButtonCreateCliente
              onSuccess={() => {
                // Refrescar la tabla después de crear un contacto
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>
    </FormBase>
  );
}