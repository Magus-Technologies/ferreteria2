"use client";

import { Form } from "antd";
import { FaSearch } from "react-icons/fa";
import { FaCartShopping, FaTruckFast } from "react-icons/fa6";
import { useState } from "react";
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

  return (
    <FormBase
      form={form}
      name="filtros-mis-ventas"
      initialValues={{
        desde: dayjs().startOf("day"),
        hasta: dayjs().endOf("day"),
      }}
      className="w-full"
      onFinish={(values) => {
        const { desde, hasta, estado_de_venta, serie_numero, ...rest } =
          values;
        
        // Separar serie y número si viene concatenado con guión
        let serie: string | undefined;
        let numero: number | undefined;
        if (serie_numero) {
          const parts = serie_numero.split('-');
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
      }}
    >
      <TituloModulos
        title="Mis Ventas"
        icon={<FaCartShopping className="text-amber-600" />}
      >
        <SelectAlmacen
          propsForm={{
            name: "almacen_id",
            hasFeedback: false,
            className: "!min-w-[220px] !w-[220px] !max-w-[220px]",
            rules: [{ required: true, message: "" }],
          }}
          className="w-full"
          formWithMessage={false}
          form={form}
        />
      </TituloModulos>

      {/* Filtros con labels inline */}
      <div className="mt-4 space-y-2.5">
        {/* Fila 1: Fecha Venta, Hasta, Digite Nombre del cliente */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Fecha Venta:
            </label>
            <DatePickerBase
              propsForm={{
                name: "desde",
                hasFeedback: false,
                className: "!w-[150px]",
              }}
              placeholder="Fecha Venta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{
                name: "hasta",
                hasFeedback: false,
                className: "!w-[150px]",
              }}
              placeholder="Hasta"
              formWithMessage={false}
              prefix={<FaCalendar size={15} className="text-amber-600 mx-1" />}
              allowClear
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Digite Nombre del cliente:
            </label>
            <SelectClientes
              propsForm={{
                name: "cliente_id",
                hasFeedback: false,
                className: "!w-[350px]",
              }}
              className="w-full"
              classIconSearch="!mb-0"
              formWithMessage={false}
              allowClear
              form={form}
              placeholder="Digite nombre del cliente"
            />
          </div>
        </div>

        {/* Fila 2: T.Doc, Serie y N°, F.Pago, Listar Ventas */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              T.Doc:
            </label>
            <SelectTipoDocumento
              propsForm={{
                name: "tipo_documento",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Serie y N°:
            </label>
            <InputBase
              propsForm={{
                name: "serie_numero",
                hasFeedback: false,
                className: "!w-[180px]",
              }}
              placeholder="000-0000000"
              formWithMessage={false}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              F.Pago:
            </label>
            <SelectFormaDePago
              propsForm={{
                name: "forma_de_pago",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Listar Ventas:
            </label>
            <InputBase
              propsForm={{
                name: "listar_ventas",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              placeholder="TODOS"
              formWithMessage={false}
            />
          </div>
        </div>

        {/* Fila 3: VEND, Cajero, Registradora, T.Pago, Estado Cta */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              VEND:
            </label>
            <SelectUsuarios
              propsForm={{
                name: "user_id",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="Todos"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Cajero:
            </label>
            <SelectUsuarios
              propsForm={{
                name: "cajero_id",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              className="w-full"
              formWithMessage={false}
              allowClear
              placeholder="EFRAIN"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Registradora:
            </label>
            <InputBase
              propsForm={{
                name: "registradora",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              placeholder="SERVIDOR"
              formWithMessage={false}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              T.Pago:
            </label>
            <InputBase
              propsForm={{
                name: "tipo_pago",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Estado Cta:
            </label>
            <InputBase
              propsForm={{
                name: "estado_cuenta",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
          </div>
        </div>

        {/* Fila 4: Sucu, Version Venta, Tipo Ope, Botón Buscar, Entrega de Productos */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Sucu:
            </label>
            <InputBase
              propsForm={{
                name: "sucursal",
                hasFeedback: false,
                className: "!w-[150px]",
              }}
              placeholder="MI REDENTOR"
              formWithMessage={false}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Version Venta:
            </label>
            <InputBase
              propsForm={{
                name: "version_venta",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Tipo Ope:
            </label>
            <InputBase
              propsForm={{
                name: "tipo_operacion",
                hasFeedback: false,
                className: "!w-[130px]",
              }}
              placeholder="Todos"
              formWithMessage={false}
            />
          </div>
          <ButtonBase
            color="info"
            size="md"
            type="submit"
            className="flex items-center gap-2"
          >
            <FaSearch />
            Buscar
          </ButtonBase>
          <ButtonBase
            color="warning"
            size="md"
            type="button"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => {
              if (!ventaSeleccionada) {
                return;
              }
              setModalEntregarOpen(true);
            }}
          >
            <FaTruckFast />
            Entregar Productos
          </ButtonBase>
          <ButtonBase
            color="info"
            size="md"
            type="button"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={() => {
              if (!ventaSeleccionada) {
                return;
              }
              setModalVerEntregasOpen(true);
            }}
          >
            <FaTruckFast />
            Ver Entregas
          </ButtonBase>
        </div>
      </div>

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
