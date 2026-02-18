"use client";

import { Form, Drawer, Badge, Select } from "antd";
import { FaSearch, FaFilter, FaCalendar } from "react-icons/fa";
import { GiMoneyStack } from "react-icons/gi";
import { useState, useMemo } from "react";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectUsuarios from "~/app/_components/form/selects/select-usuarios";
import InputBase from "~/app/_components/form/inputs/input-base";
import { Dayjs } from "dayjs";
import { useStoreFiltrosMisGanancias } from "~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias";
import { useStoreAlmacen } from "~/store/store-almacen";
import { useEffect } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { clienteApi } from "~/lib/api/cliente";
import { useDebounce } from "use-debounce";

interface ValuesFiltersMisGanancias {
  desde?: Dayjs;
  hasta?: Dayjs;
  cliente_id?: number;
  cliente_search_text?: string;
  user_id?: string;
  serie_numero?: string;
  incluir?: string;
  marca?: string;
  vendedor?: string;
  forma_pago?: string;
  confirmar_caja?: string;
  tipo_doc?: string;
  serie_n?: string;
  sucursal?: string;
  mostrar_hora?: boolean;
}

export default function FiltersMisGanancias() {
  const [form] = Form.useForm<ValuesFiltersMisGanancias>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clienteSearchText, setClienteSearchText] = useState<string>("");
  const [debouncedClienteSearch] = useDebounce(clienteSearchText, 300);

  // Query para obtener clientes
  const { data: clientesData, isLoading: clientesLoading } = useQuery({
    queryKey: ['clientes', debouncedClienteSearch],
    queryFn: () => clienteApi.getAll({ 
      search: debouncedClienteSearch || undefined,
      per_page: 20 
    }),
    enabled: true, // Siempre habilitado para mostrar algunos clientes por defecto
  });

  const almacen_id = useStoreAlmacen((state) => state.almacen_id);
  const setFiltros = useStoreFiltrosMisGanancias((state) => state.setFiltros);

  // Inicializar filtros con almacén y fechas por defecto
  useEffect(() => {
    if (almacen_id) {
      const filtrosIniciales = {
        almacen_id,
        desde: dayjs().startOf("month").format("YYYY-MM-DD"),
        hasta: dayjs().endOf("day").format("YYYY-MM-DD"),
        mostrar_hora: "false", // Inicializar como string
      };
      setFiltros(filtrosIniciales);
    }
  }, [almacen_id, setFiltros]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue();
    let count = 0;
    if (values.cliente_id) count++;
    if (values.user_id) count++;
    if (values.serie_numero) count++;
    if (values.incluir) count++;
    if (values.marca) count++;
    if (values.vendedor) count++;
    if (values.forma_pago) count++;
    if (values.confirmar_caja) count++;
    if (values.tipo_doc) count++;
    if (values.serie_n) count++;
    if (values.sucursal) count++;
    return count;
  }, [form]);

  const handleFinish = (values: ValuesFiltersMisGanancias) => {
    const { desde, hasta, serie_numero, cliente_id, mostrar_hora, ...rest } = values;
    
    let serie: string | undefined;
    let numero: number | undefined;
    if (serie_numero) {
      const parts = serie_numero.split("-");
      if (parts.length === 2) {
        serie = parts[0].trim();
        numero = parseInt(parts[1].trim());
      }
    }

    const data: any = {
      almacen_id,
      ...rest,
      ...(cliente_id ? { cliente_id } : {}),
      ...(!cliente_id && clienteSearchText ? { search: clienteSearchText } : {}),
      ...(desde ? { desde: desde.format("YYYY-MM-DD") } : {}),
      ...(hasta ? { hasta: hasta.format("YYYY-MM-DD") } : {}),
      ...(serie ? { serie } : {}),
      ...(numero ? { numero } : {}),
      // Convertir mostrar_hora a string
      mostrar_hora: String(Boolean(mostrar_hora)),
    };

    // Limpiar valores undefined, null o vacíos (pero no false para booleanos)
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null || data[key] === "") {
        delete data[key];
      }
    });

    console.log("🔍 Filtros aplicados:", data);
    setFiltros(data);
    setDrawerOpen(false);
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-ganancias"
      initialValues={{
        almacen_id: almacen_id,
        desde: dayjs().startOf("month"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Ganancias"
        icon={<GiMoneyStack className="text-rose-600" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <SelectAlmacen
            propsForm={{
              name: "almacen_id",
              hasFeedback: false,
              className: "w-full sm:!min-w-[220px] sm:!w-[220px]",
              rules: [{ required: true, message: "" }],
            }}
            className="w-full"
            formWithMessage={false}
            form={form}
          />

          {/* Mobile/Tablet: Botón para abrir drawer */}
          <div className="flex lg:hidden items-center gap-2">
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex items-center gap-2"
            >
              <FaSearch />
            </ButtonBase>
            <Badge count={activeFiltersCount} offset={[-5, 5]}>
              <ButtonBase
                color="warning"
                size="md"
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <FaFilter />
                Filtros
              </ButtonBase>
            </Badge>
          </div>
        </div>
      </TituloModulos>

      {/* Filtros Desktop - Dos filas optimizadas */}
      <div className="hidden lg:block mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1 */}
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Fecha:
            </label>
            <ConfigurableElement componentId="field-fecha-desde" label="Campo Fecha Desde">
              <DatePickerBase
                propsForm={{
                  name: "desde",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="29/06/2025"
                formWithMessage={false}
                prefix={
                  <FaCalendar size={13} className="text-rose-600 mx-1" />
                }
                allowClear
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Hasta:
            </label>
            <ConfigurableElement componentId="field-fecha-hasta" label="Campo Fecha Hasta">
              <DatePickerBase
                propsForm={{
                  name: "hasta",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder="29/06/2025"
                formWithMessage={false}
                prefix={
                  <FaCalendar size={13} className="text-rose-600 mx-1" />
                }
                allowClear
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-3 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Producto/Servicio:
            </label>
            <ConfigurableElement componentId="field-producto-servicio" label="Campo Producto/Servicio">
              <InputBase
                propsForm={{
                  name: "producto_servicio",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder=""
                formWithMessage={false}
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Cliente (F1):
            </label>
            <ConfigurableElement componentId="field-cliente" label="Campo Cliente">
              <Form.Item name="cliente_id" noStyle>
                <Select
                  allowClear
                  showSearch
                  placeholder="Buscar cliente..."
                  className="w-full"
                  loading={clientesLoading}
                  filterOption={false}
                  onSearch={(value: string) => setClienteSearchText(value)}
                  onChange={(value: number | undefined) => {
                    if (!value) {
                      form.setFieldValue("cliente_id", undefined);
                      setClienteSearchText("");
                    }
                  }}
                  options={
                    clientesData?.data?.data
                      ? clientesData.data.data.map((cliente) => ({
                          value: cliente.id,
                          label: cliente.razon_social
                            ? `${cliente.numero_documento} - ${cliente.razon_social}`
                            : `${cliente.numero_documento} - ${cliente.nombres} ${cliente.apellidos}`,
                        }))
                      : []
                  }
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-3 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Vendedor:
            </label>
            <ConfigurableElement componentId="field-vendedor" label="Campo Vendedor">
              <SelectUsuarios
                propsForm={{
                  name: "user_id",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                className="w-full"
                formWithMessage={false}
                allowClear
                placeholder="Todos"
              />
            </ConfigurableElement>
          </div>

          {/* Fila 2 */}
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Incluir:
            </label>
            <ConfigurableElement componentId="field-incluir" label="Campo Incluir">
              <Form.Item name="incluir" noStyle>
                <Select
                  allowClear
                  placeholder="Todos"
                  className="w-full"
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'con_ganancia', label: 'Con Ganancia' },
                    { value: 'con_perdida', label: 'Con Pérdida' },
                    { value: 'sin_costo', label: 'Sin Costo' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Marca:
            </label>
            <ConfigurableElement componentId="field-marca" label="Campo Marca">
              <Form.Item name="marca" noStyle>
                <Select
                  allowClear
                  placeholder="Todas"
                  className="w-full"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { value: 'PAVCO', label: 'PAVCO' },
                    { value: 'SIN MARCA', label: 'SIN MARCA' },
                    { value: 'TIGRE', label: 'TIGRE' },
                    { value: 'NICOLL', label: 'NICOLL' },
                    { value: 'ETERNIT', label: 'ETERNIT' },
                    { value: 'OTROS', label: 'OTROS' },
                    { value: 'STANLEY', label: 'STANLEY' },
                    { value: 'TRUPER', label: 'TRUPER' },
                    { value: 'DEWALT', label: 'DEWALT' },
                    { value: 'BLACK DECKER', label: 'BLACK DECKER' },
                    { value: 'SIKA', label: 'SIKA' },
                    { value: 'ROTOPLAS', label: 'ROTOPLAS' },
                    { value: 'TRAMONTINA', label: 'TRAMONTINA' },
                    { value: '3M', label: '3M' },
                    { value: 'PHILIPS', label: 'PHILIPS' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              F.Pago:
            </label>
            <ConfigurableElement componentId="field-forma-pago" label="Campo Forma Pago">
              <Form.Item name="forma_pago" noStyle>
                <Select
                  allowClear
                  placeholder="Todas"
                  className="w-full"
                  options={[
                    { value: 'co', label: 'Contado' },
                    { value: 'cr', label: 'Crédito' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              C.Caja:
            </label>
            <ConfigurableElement componentId="field-confirmar-caja" label="Campo Confirmar Caja">
              <Form.Item name="confirmar_caja" noStyle>
                <Select
                  allowClear
                  placeholder="Todas"
                  className="w-full"
                  options={[
                    { value: 'E', label: 'Efectivo' },
                    { value: 'D', label: 'Digital' },
                    { value: 'T', label: 'Transferencia' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              T.Doc:
            </label>
            <ConfigurableElement componentId="field-tipo-doc" label="Campo Tipo Documento">
              <Form.Item name="tipo_doc" noStyle>
                <Select
                  allowClear
                  placeholder="Todos"
                  className="w-full"
                  options={[
                    { value: 'nv', label: 'Nota de Venta' },
                    { value: '03', label: 'Boleta' },
                    { value: '01', label: 'Factura' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Serie-N°:
            </label>
            <ConfigurableElement componentId="field-serie-numero" label="Campo Serie y Número">
              <InputBase
                propsForm={{
                  name: "serie_numero",
                  hasFeedback: false,
                  className: "!w-full",
                }}
                placeholder=""
                formWithMessage={false}
              />
            </ConfigurableElement>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Sucursal:
            </label>
            <ConfigurableElement componentId="field-sucursal" label="Campo Sucursal">
              <Form.Item name="sucursal" noStyle>
                <Select
                  allowClear
                  placeholder="Todas"
                  className="w-full"
                  options={[
                    { value: 'principal', label: 'ALMACÉN PRINCIPAL' },
                    { value: 'almacen_2', label: 'ALMACÉN 2' },
                    { value: 'almacen_3', label: 'ALMACÉN 3' },
                  ]}
                />
              </Form.Item>
            </ConfigurableElement>
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <ConfigurableElement componentId="button-buscar" label="Botón Buscar">
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
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <ConfigurableElement componentId="button-limpiar" label="Botón Limpiar">
              <ButtonBase
                color="default"
                size="md"
                type="button"
                onClick={() => {
                  form.resetFields();
                  setClienteSearchText("");
                  // Aplicar filtros con valores por defecto
                  const filtrosLimpios = {
                    almacen_id,
                    desde: dayjs().startOf("month").format("YYYY-MM-DD"),
                    hasta: dayjs().endOf("day").format("YYYY-MM-DD"),
                    mostrar_hora: "false", // Reset como string
                  };
                  setFiltros(filtrosLimpios);
                }}
                className="flex items-center gap-2 w-full justify-center"
              >
                Limpiar
              </ButtonBase>
            </ConfigurableElement>
          </div>
        </div>
      </div>

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FaFilter className="text-rose-600" />
            <span>Filtros de Búsqueda</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={Math.min(
          400,
          typeof window !== "undefined" ? window.innerWidth - 40 : 360,
        )}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Fecha Desde:
            </label>
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false }}
              placeholder="Fecha"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-rose-600 mx-1" />}
              allowClear
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{ name: "hasta", hasFeedback: false }}
              placeholder="Hasta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-rose-600 mx-1" />}
              allowClear
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Producto/Servicio:
            </label>
            <InputBase
              propsForm={{ name: "producto_servicio", hasFeedback: false }}
              placeholder="Digite producto o servicio"
              formWithMessage={false}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Cliente:
            </label>
            <Form.Item name="cliente_id" noStyle>
              <Select
                allowClear
                showSearch
                placeholder="Buscar cliente..."
                className="w-full"
                loading={clientesLoading}
                filterOption={false}
                onSearch={(value: string) => setClienteSearchText(value)}
                onChange={(value: number | undefined) => {
                  if (!value) {
                    form.setFieldValue("cliente_id", undefined);
                    setClienteSearchText("");
                  }
                }}
                options={
                  clientesData?.data?.data
                    ? clientesData.data.data.map((cliente) => ({
                        value: cliente.id,
                        label: cliente.razon_social
                          ? `${cliente.numero_documento} - ${cliente.razon_social}`
                          : `${cliente.numero_documento} - ${cliente.nombres} ${cliente.apellidos}`,
                      }))
                    : []
                }
              />
            </Form.Item>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Vendedor:
            </label>
            <SelectUsuarios
              propsForm={{ name: "user_id", hasFeedback: false }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Serie y N°:
            </label>
            <InputBase
              propsForm={{ name: "serie_numero", hasFeedback: false }}
              placeholder="000-0000000"
              formWithMessage={false}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <ButtonBase
              color="default"
              size="md"
              type="button"
              onClick={() => {
                form.resetFields();
                form.submit();
              }}
              className="flex-1"
            >
              Limpiar
            </ButtonBase>
            <ButtonBase
              color="info"
              size="md"
              type="submit"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <FaSearch />
              Aplicar
            </ButtonBase>
          </div>
        </div>
      </Drawer>
    </FormBase>
  );
}