"use client";

import { Form, Select } from "antd";
import { FaSearch, FaGift } from "react-icons/fa";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import { useState } from "react";
import { redColors, orangeColors, greenColors } from "~/lib/colors";

interface ValuesFiltersValesCompra {
  search?: string;
  estado?: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
  tipo_promocion?: string;
  modalidad?: string;
  vigentes?: boolean;
}

export default function FiltersValesCompra() {
  const [form] = Form.useForm<ValuesFiltersValesCompra>();
  const [filters, setFilters] = useState<ValuesFiltersValesCompra>({});

  const handleSearch = (values: ValuesFiltersValesCompra) => {
    console.log("Filtros:", values);
    setFilters(values);
    // Aquí se conectará con React Query para refetch
  };

  return (
    <FormBase
      form={form}
      name="filtros-vales-compra"
      initialValues={{
        estado: 'ACTIVO',
        vigentes: true,
      }}
      className="w-full"
      onFinish={handleSearch}
    >
      <TituloModulos
        title="Vales de Compra (Promociones)"
        icon={<FaGift className="text-amber-600" />}
      />

      {/* Filtros Desktop - Ocupan todo el espacio */}
      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1 */}
          <div className="col-span-3 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Buscar:
            </label>
            <InputBase
              propsForm={{
                name: "search",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Código o nombre del vale..."
              formWithMessage={false}
            />
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado:
            </label>
            <Form.Item name="estado" noStyle className="flex-1">
              <Select
                className="!w-full"
                placeholder="Estado"
                options={[
                  { label: 'Activo', value: 'ACTIVO' },
                  { label: 'Pausado', value: 'PAUSADO' },
                  { label: 'Finalizado', value: 'FINALIZADO' },
                ]}
                allowClear
              />
            </Form.Item>
          </div>

          <div className="col-span-3 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tipo:
            </label>
            <Form.Item name="tipo_promocion" noStyle className="flex-1">
              <Select
                className="!w-full"
                placeholder="Tipo de promoción"
                options={[
                  { label: 'Sorteo', value: 'SORTEO' },
                  { label: 'Desc. Misma Compra', value: 'DESCUENTO_MISMA_COMPRA' },
                  { label: 'Desc. Próxima Compra', value: 'DESCUENTO_PROXIMA_COMPRA' },
                  { label: 'Producto Gratis', value: 'PRODUCTO_GRATIS' },
                ]}
                allowClear
              />
            </Form.Item>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Modalidad:
            </label>
            <Form.Item name="modalidad" noStyle className="flex-1">
              <Select
                className="!w-full"
                placeholder="Modalidad"
                options={[
                  { label: 'Por Cantidad', value: 'CANTIDAD_MINIMA' },
                  { label: 'Por Categoría', value: 'POR_CATEGORIA' },
                  { label: 'Por Productos', value: 'POR_PRODUCTOS' },
                  { label: 'Mixto', value: 'MIXTO' },
                ]}
                allowClear
              />
            </Form.Item>
          </div>

          <div className="col-span-1 flex items-center gap-2">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2 w-full justify-center"
            >
              <FaSearch />
              Buscar
            </ButtonBase>
          </div>

          <div className="col-span-1 flex items-center gap-2">
            <ButtonBase
              color="default"
              size="md"
              type="button"
              onClick={() => {
                form.resetFields();
                form.submit();
              }}
              className="w-full justify-center"
            >
              Limpiar
            </ButtonBase>
          </div>
        </div>
      </div>
    </FormBase>
  );
}
