"use client";

import { Form, Drawer, Badge } from "antd";
import { FaSearch, FaFilter } from "react-icons/fa";
import { FaCartShopping, FaTruckFast } from "react-icons/fa6";
import { useState, useMemo } from "react";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import { EstadoDeVenta, Prisma } from "@prisma/client";
import { useStoreFiltrosMisVentas } from "../../_store/store-filtros-mis-ventas";
import { FaCalendar } from "react-icons/fa6";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectFormaDePago from "~/app/_components/form/selects/select-forma-de-pago";
import SelectClientes from "~/app/_components/form/selects/select-clientes";
import SelectTipoDocumento from "~/app/_components/form/selects/select-tipo-documento";
import SelectUsuarios from "~/app/_components/form/selects/select-usuarios";
import { Dayjs } from "dayjs";
import { FormaDePago, TipoDocumento } from "@prisma/client";
import { toUTCBD } from "~/utils/fechas";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useStoreAlmacen } from "~/store/store-almacen";
import InputBase from "~/app/_components/form/inputs/input-base";
import ModalEntregarProductos from "../modals/modal-entregar-productos";
import ModalVerEntregas from "../modals/modal-ver-entregas";
import { useStoreVentaSeleccionada } from "../tables/table-mis-ventas";

interface ValuesFiltersMisVentas {
  almacen_id: number;
  cliente_id?: number;
  desde?: Dayjs;
  hasta?: Dayjs;
  forma_de_pago?: FormaDePago;
  tipo_documento?: TipoDocumento;
  user_id?: string;
  estado_de_venta?: EstadoDeVenta;
  serie_numero?: string;
}

export default function FiltersMisVentas() {
  const [form] = Form.useForm<ValuesFiltersMisVentas>();
  const [modalEntregarOpen, setModalEntregarOpen] = useState(false);
  const [modalVerEntregasOpen, setModalVerEntregasOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const almacen_id = useStoreAlmacen((state) => state.almacen_id);
  const ventaSeleccionada = useStoreVentaSeleccionada((state) => state.venta);

  const setFiltros = useStoreFiltrosMisVentas((state) => state.setFiltros);

  useEffect(() => {
    const data = {
      almacen_id,
      fecha: {
        gte: toUTCBD({ date: dayjs().startOf("day") }),
        lte: toUTCBD({ date: dayjs().endOf("day") }),
      },
      estado_de_venta: {
        in: [EstadoDeVenta.Creado, EstadoDeVenta.Procesado],
      },
    } satisfies Prisma.VentaWhereInput;
    setFiltros(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue();
    let count = 0;
    if (values.cliente_id) count++;
    if (values.tipo_documento) count++;
    if (values.forma_de_pago) count++;
    if (values.user_id) count++;
    if (values.serie_numero) count++;
    return count;
  }, [form]);

  const handleFinish = (values: ValuesFiltersMisVentas) => {
    const { desde, hasta, estado_de_venta, serie_numero, ...rest } = values;

    let serie: string | undefined;
    let numero: number | undefined;
    if (serie_numero) {
      const parts = serie_numero.split("-");
      if (parts.length === 2) {
        serie = parts[0].trim();
        numero = parseInt(parts[1].trim());
      }
    }

    const data = {
      ...rest,
      fecha: {
        gte: desde ? toUTCBD({ date: desde.startOf("day") }) : undefined,
        lte: hasta ? toUTCBD({ date: hasta.endOf("day") }) : undefined,
      },
      ...(serie ? { serie } : {}),
      ...(numero ? { numero } : {}),
      ...(estado_de_venta ? { estado_de_venta } : {}),
    } satisfies Prisma.VentaWhereInput;
    setFiltros(data);
    setDrawerOpen(false);
  };

  return (
    <FormBase
      form={form}
      name="filtros-mis-ventas"
      initialValues={{
        desde: dayjs().startOf("day"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={handleFinish}
    >
      <TituloModulos
        title="Mis Ventas"
        icon={<FaCartShopping className="text-amber-600" />}
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

      {/* Filtros Desktop - Ocupan todo el espacio */}
      <div className="hidden lg:block mt-4">
        <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
          {/* Fila 1 */}
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Fecha Venta:
            </label>
            <DatePickerBase
              propsForm={{
                name: "desde",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Fecha"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{
                name: "hasta",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Hasta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
            />
          </div>
          <div className="col-span-4 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Cliente:
            </label>
            <SelectClientes
              propsForm={{
                name: "cliente_id",
                hasFeedback: false,
                className: "!w-full",
              }}
              className="w-full"
              classIconSearch="!mb-0"
              formWithMessage={false}
              allowClear
              form={form}
              placeholder="Digite nombre del cliente"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              T.Doc:
            </label>
            <SelectTipoDocumento
              propsForm={{
                name: "tipo_documento",
                hasFeedback: false,
                className: "!w-full",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Serie N°:
            </label>
            <InputBase
              propsForm={{
                name: "serie_numero",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="000-0000000"
              formWithMessage={false}
            />
          </div>

          {/* Fila 2 */}
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              F.Pago:
            </label>
            <SelectFormaDePago
              propsForm={{
                name: "forma_de_pago",
                hasFeedback: false,
                className: "!w-full",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Listar Ventas:
            </label>
            <InputBase
              propsForm={{
                name: "listar_ventas",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="TODOS"
              formWithMessage={false}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              VEND:
            </label>
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
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Cajero:
            </label>
            <SelectUsuarios
              propsForm={{
                name: "cajero_id",
                hasFeedback: false,
                className: "!w-full",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="EFRAIN"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Registradora:
            </label>
            <InputBase
              propsForm={{
                name: "registradora",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="SERVIDOR"
              formWithMessage={false}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              T.Pago:
            </label>
            <InputBase
              propsForm={{
                name: "tipo_pago",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
          </div>

          {/* Fila 3 */}
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado Cta:
            </label>
            <InputBase
              propsForm={{
                name: "estado_cuenta",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Sucu:
            </label>
            <InputBase
              propsForm={{
                name: "sucursal",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="MI REDENTOR"
              formWithMessage={false}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Version Venta:
            </label>
            <InputBase
              propsForm={{
                name: "version_venta",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tipo Ope:
            </label>
            <InputBase
              propsForm={{
                name: "tipo_operacion",
                hasFeedback: false,
                className: "!w-full",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
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
          <div className="col-span-2 flex items-center gap-2">
            <ButtonBase
              color="warning"
              size="md"
              type="button"
              className="flex items-center gap-2 whitespace-nowrap w-full justify-center text-xs"
              onClick={() => ventaSeleccionada && setModalEntregarOpen(true)}
              disabled={!ventaSeleccionada}
            >
              <FaTruckFast />
              Entregar Productos
            </ButtonBase>
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <ButtonBase
              color="info"
              size="md"
              type="button"
              className="flex items-center gap-2 whitespace-nowrap w-full justify-center text-xs"
              onClick={() => ventaSeleccionada && setModalVerEntregasOpen(true)}
              disabled={!ventaSeleccionada}
            >
              <FaTruckFast />
              Ver Entregas
            </ButtonBase>
          </div>
        </div>
      </div>

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <FaFilter className="text-amber-600" />
            <span>Filtros de Búsqueda</span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={Math.min(
          400,
          typeof window !== "undefined" ? window.innerWidth - 40 : 360
        )}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Fecha Venta:
            </label>
            <DatePickerBase
              propsForm={{ name: "desde", hasFeedback: false }}
              placeholder="Fecha Venta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
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
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Cliente:
            </label>
            <SelectClientes
              propsForm={{ name: "cliente_id", hasFeedback: false }}
              className="w-full"
              classIconSearch="!mb-0"
              formWithMessage={false}
              allowClear
              form={form}
              placeholder="Digite nombre del cliente"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Tipo Documento:
            </label>
            <SelectTipoDocumento
              propsForm={{ name: "tipo_documento", hasFeedback: false }}
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
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Forma de Pago:
            </label>
            <SelectFormaDePago
              propsForm={{ name: "forma_de_pago", hasFeedback: false }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
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

      <ModalEntregarProductos
        open={modalEntregarOpen}
        setOpen={setModalEntregarOpen}
        venta={ventaSeleccionada}
      />

      <ModalVerEntregas
        open={modalVerEntregasOpen}
        setOpen={setModalVerEntregasOpen}
        venta={ventaSeleccionada}
      />
    </FormBase>
  );
}
