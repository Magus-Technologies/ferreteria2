"use client";

import { Form, Switch } from "antd";
import { FaSearch } from "react-icons/fa";
import { IoMdContact } from "react-icons/io";
import { useQueryClient } from "@tanstack/react-query";
import { TipoCliente } from "~/lib/api/cliente";
import { useStoreFiltrosMisContactos } from "../../_store/store-filtros-mis-contactos";
import ButtonCreateCliente from "~/app/_components/form/buttons/button-create-cliente";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import SelectBase from "~/app/_components/form/selects/select-base";
import SelectTipoCliente from "~/app/_components/form/selects/select-tipo-cliente";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface ValuesFiltersMisContactos {
  search?: string;
  tipo_cliente?: TipoCliente;
  estado?: string;
  con_recomendaciones?: boolean;
  calificacion?: string;
  ordenar_por_frecuencia?: boolean;
}

export default function FiltersMisContactos() {
  const [form] = Form.useForm<ValuesFiltersMisContactos>();
  const { setFiltros } = useStoreFiltrosMisContactos();
  const queryClient = useQueryClient();

  const handleFinish = (values: ValuesFiltersMisContactos) => {
    const data: any = {};
    if (values.search) data.search = values.search;
    if (values.tipo_cliente) data.tipo_cliente = values.tipo_cliente;
<<<<<<< HEAD
    if (values.estado !== undefined && values.estado !== '') data.estado = values.estado === 'true';
    if (values.calificacion !== undefined && values.calificacion !== '') data.calificacion = values.calificacion;
=======
    // Enviar siempre estado (undefined limpia el filtro en el store)
    data.estado = (values.estado !== undefined && values.estado !== null && values.estado !== '')
      ? values.estado === 'true' || values.estado === true
      : undefined;
>>>>>>> 21a73bdb0cf4f5d7c872979ea05721881927759b
    data.con_recomendaciones = values.con_recomendaciones || undefined;
    data.ordenar_por_frecuencia = values.ordenar_por_frecuencia || undefined;
    setFiltros(data);
    queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] });
  };

  return (
    <FormBase form={form} name="filtros-mis-contactos" className="w-full" onFinish={handleFinish}>
      <TituloModulos title="Mis Clientes" icon={<IoMdContact className="text-cyan-600" />} />

      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-2 gap-y-2 items-center">
          {/* Buscar */}
          <div className="col-span-3 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Buscar:</label>
            <InputBase
              propsForm={{ name: "search", hasFeedback: false, className: "!w-full" }}
              placeholder="RUC/DNI, Razón Social, Nombres..."
              formWithMessage={false}
            />
          </div>

          {/* Tipo */}
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Tipo:</label>
            <SelectTipoCliente
              propsForm={{ name: "tipo_cliente", hasFeedback: false, className: "!w-full" }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>

          {/* Estado */}
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Estado:</label>
            <SelectBase
              propsForm={{ name: "estado", hasFeedback: false, className: "!w-full" }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
              options={[
                { value: "true", label: "Activo" },
                { value: "false", label: "Inactivo" },
              ]}
            />
          </div>

          {/* Calificación */}
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap text-right">Cal.:</label>
            <SelectBase
              propsForm={{ name: "calificacion", hasFeedback: false, className: "!w-full" }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
              options={[
                { value: "excelente", label: "Excelente" },
                { value: "bueno", label: "Bueno" },
                { value: "regular", label: "Regular" },
                { value: "problematico", label: "Problemático" },
              ]}
            />
          </div>

          {/* Con recomendaciones */}
          <div className="col-span-2 flex items-center gap-2 px-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Con recomendaciones:</label>
            <Form.Item name="con_recomendaciones" valuePropName="checked" noStyle>
              <Switch size="small" onChange={() => form.submit()} />
            </Form.Item>
          </div>

          {/* Frecuentes */}
          <div className="col-span-1 flex items-center gap-2 px-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Frecuentes:</label>
            <Form.Item name="ordenar_por_frecuencia" valuePropName="checked" noStyle>
              <Switch size="small" onChange={() => form.submit()} />
            </Form.Item>
          </div>

          {/* Buscar + Crear */}
          <div className="col-span-2 flex items-center gap-2">
            <ButtonBase color="info" size="md" type="submit" className="flex items-center gap-2 justify-center h-10 flex-1">
              <FaSearch />
              Buscar
            </ButtonBase>
            <ButtonCreateCliente
              onSuccess={() => queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] })}
            />
          </div>
        </div>
      </div>
    </FormBase>
  );
}
