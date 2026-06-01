"use client";

import { Form } from "antd";
import { useStoreFiltrosMisGuias } from "../../_store/store-filtros-mis-guias";
import FormBase from "~/components/form/form-base";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import SelectBase from "~/app/_components/form/selects/select-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import { FaSearch, FaTruckLoading, FaPlus } from "react-icons/fa";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import ButtonBase from "~/components/buttons/button-base";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FilterDateRangeFields from "~/app/_components/filters/filter-date-range-fields";

export default function FiltersMisGuias() {
  const [form] = Form.useForm();
  const { setFiltros } = useStoreFiltrosMisGuias();
  const router = useRouter();

  useEffect(() => {
    // Inicializar con fechas por defecto
    const data = {
      fecha_desde: dayjs().startOf("day"),
      fecha_hasta: dayjs().endOf("day"),
    };
    setFiltros(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = (values: any) => {
    const { fecha_desde, fecha_hasta, ...rest } = values;

    const data: any = {
      ...rest,
      ...(fecha_desde ? { fecha_desde } : {}),
      ...(fecha_hasta ? { fecha_hasta } : {}),
    };

    // Limpiar valores undefined, null o vacíos
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        delete data[key];
      }
    });

    console.log("🔍 Filtros aplicados:", data);
    setFiltros(data);
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-guias"
      initialValues={{
        fecha_desde: dayjs().startOf("day"),
        fecha_hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Guías"
        icon={<FaTruckLoading className="text-orange-600" />}
      />

      {/* Filtros Desktop */}
      <div className="mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1 */}
          <ConfigurableElement
            componentId="mis-guias.filtro-rango-fechas"
            label="Campo Fecha Desde y Hasta"
          >
            <div className="col-span-4 grid grid-cols-2 gap-3">
              <FilterDateRangeFields
                fromName="fecha_desde"
                toName="fecha_hasta"
                itemClassName="flex items-center gap-2"
                fromPlaceholder="Fecha"
              />
            </div>
          </ConfigurableElement>

          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado:
            </label>
            <ConfigurableElement
              componentId="mis-guias.filtro-estado"
              label="Campo Estado"
            >
              <SelectBase
                propsForm={{
                  name: "estado",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={[
                  { label: "Borrador", value: "BORRADOR" },
                  { label: "Emitida", value: "EMITIDA" },
                  { label: "Anulada", value: "ANULADA" },
                ]}
              />
            </ConfigurableElement>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tipo de Guía:
            </label>
            <ConfigurableElement
              componentId="mis-guias.filtro-tipo-guia"
              label="Campo Tipo de Guía"
            >
              <SelectBase
                propsForm={{
                  name: "tipo_guia",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
                options={[
                  { label: "E-Remitente", value: "ELECTRONICA_REMITENTE" },
                  {
                    label: "E-Transportista",
                    value: "ELECTRONICA_TRANSPORTISTA",
                  },
                  { label: "Física", value: "FISICA" },
                ]}
              />
            </ConfigurableElement>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Buscar:
            </label>
            <ConfigurableElement
              componentId="mis-guias.filtro-buscar"
              label="Campo Buscar"
            >
              <InputBase
                propsForm={{
                  name: "search",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="Serie, cliente..."
                formWithMessage={false}
              />
            </ConfigurableElement>
          </div>

          <div className="col-span-2 flex flex-col gap-1.5 justify-center">
            <ConfigurableElement
              componentId="mis-guias.boton-buscar"
              label="Botón Buscar"
            >
              <ButtonBase
                color="info"
                size="md"
                type="submit"
                className="flex items-center gap-2 w-full justify-center"
              >
                <FaSearch />
                Buscar
              </ButtonBase>
            </ConfigurableElement>
            <ButtonBase
              color="success"
              size="md"
              onClick={() =>
                router.push(
                  "/ui/facturacion-electronica/mis-guias/crear-guia",
                )
              }
              className="flex items-center gap-2 w-full justify-center"
            >
              <FaPlus />
              Crear Guía
            </ButtonBase>
          </div>
        </div>
      </div>
    </FormBase>
  );
}
