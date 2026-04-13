"use client";

import { Form, Select } from "antd";
import { FaSearch, FaGift } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import { useStoreFiltrosVales, type FiltrosVales } from "../../_store/store-filtros-vales";
import dayjs, { type Dayjs } from "dayjs";
import { toUTCBD } from "~/utils/fechas";

interface FormValues extends Omit<FiltrosVales, 'desde' | 'hasta'> {
  desde?: Dayjs;
  hasta?: Dayjs;
}

export default function FiltersValesCompra() {
  const [form] = Form.useForm<FormValues>();
  const setFiltros = useStoreFiltrosVales((s) => s.setFiltros);

  const handleSearch = (values: FormValues) => {
    const { desde, hasta, ...rest } = values;
    setFiltros({
      ...rest,
      desde: desde ? toUTCBD({ date: desde.startOf('day') }) : undefined,
      hasta: hasta ? toUTCBD({ date: hasta.endOf('day') }) : undefined,
    });
  };

  return (
    <FormBase
      form={form}
      name="filtros-vales-compra"
      initialValues={{
        estado: 'ACTIVO',
        desde: dayjs().startOf('day'),
        hasta: dayjs().endOf('day'),
      }}
      className="w-full"
      onFinish={handleSearch}
    >
      <TituloModulos
        title="Vales de Compra (Promociones)"
        icon={<FaGift className="text-amber-600" />}
      />

      {/* Filtros Desktop */}
      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1: Desde | Hasta | Buscar | Estado | Buscar btn | Limpiar btn */}
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Desde:
            </label>
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false }}
              className="!w-full"
              prefix={<FaCalendar size={13} className="text-emerald-600 mx-0.5" />}
            />
          </div>

          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{ name: "hasta", hasFeedback: false }}
              className="!w-full"
              prefix={<FaCalendar size={13} className="text-emerald-600 mx-0.5" />}
            />
          </div>

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

          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tipo:
            </label>
            <Form.Item name="tipo_promocion" noStyle className="flex-1">
              <Select
                className="!w-full"
                placeholder="Tipo promoción"
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

          <div className="col-span-1 flex items-center gap-2">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2 w-full justify-center"
            >
              <FaSearch />
            </ButtonBase>
          </div>

          {/* Fila 2: Modalidad | Limpiar */}
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
              color="default"
              size="md"
              type="button"
              onClick={() => {
                form.resetFields();
                form.submit();
              }}
              className="w-full justify-center text-xs"
            >
              Limpiar
            </ButtonBase>
          </div>
        </div>
      </div>
    </FormBase>
  );
}
