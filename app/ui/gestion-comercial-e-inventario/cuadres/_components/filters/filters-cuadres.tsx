"use client";

import { Form, Checkbox } from "antd";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import FormBase from "~/components/form/form-base";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import ButtonBase from "~/components/buttons/button-base";
import dayjs from "dayjs";
import SelectBase from "~/app/_components/form/selects/select-base";
import { useCuadresContext } from "../../_contexts/cuadres-context";

export default function FiltersCuadres() {
    const [form] = Form.useForm();
    const { handleSearch, loading } = useCuadresContext();

    return (
        <div className="w-full p-2">
            <FormBase
                form={form}
                name="filters-cuadres"
                initialValues={{
                    desde: dayjs().startOf('month'),
                    hasta: dayjs(),
                    listar_no_anuladas: true,
                    tipo: 'TODOS'
                }}
                onFinish={handleSearch}
                className="w-full"
            >
                <div className="flex flex-col gap-4">
                    {/* Fila 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="col-span-1">
                            <LabelBase label="Desde:" orientation="row" className="w-full !text-[12px] font-semibold min-w-[70px]">
                                <DatePickerBase
                                    propsForm={{ name: "desde" }}
                                    className="w-full !h-11"
                                    placeholder="Desde"
                                    prefix={<FaCalendarAlt className="text-emerald-600 mx-1" size={13} />}
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-1">
                            <LabelBase label="Hasta:" orientation="row" className="w-full !text-[12px] font-semibold min-w-[70px]">
                                <DatePickerBase
                                    propsForm={{ name: "hasta" }}
                                    className="w-full !h-11"
                                    placeholder="Hasta"
                                    prefix={<FaCalendarAlt className="text-emerald-600 mx-1" size={13} />}
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-1">
                            <LabelBase label="Sucursal:" orientation="row" className="w-full !text-[12px] font-semibold min-w-[80px]">
                                <SelectAlmacen
                                    propsForm={{ name: "almacen_id" }}
                                    className="!min-w-0 w-full !h-11"
                                    size="middle"
                                    sizeIcon={14}
                                    classNameIcon="text-emerald-600 mx-1"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-1">
                            <LabelBase label="Tipo:" orientation="row" className="w-full !text-[12px] font-semibold min-w-[60px]">
                                <SelectBase
                                    propsForm={{ name: "tipo" }}
                                    className="w-full !h-11"
                                    size="middle"
                                    options={[
                                        { label: 'TODOS', value: 'TODOS' },
                                        { label: 'AJUSTE', value: 'AJUSTE' },
                                        { label: 'CUADRE INVENTARIO', value: 'CUADRE INVENTARIO' },
                                        { label: 'MERMA', value: 'MERMA' },
                                    ]}
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-1">
                            <LabelBase label="Producto:" orientation="row" className="w-full !text-[12px] font-semibold min-w-[80px]">
                                <InputBase
                                    propsForm={{ name: "search_producto" }}
                                    placeholder="Buscar..."
                                    className="w-full !h-11 bg-yellow-50/50"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                    </div>

                    {/* Fila 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="col-span-1">
                            <LabelBase label="Proveedor:" orientation="row" className="w-full !text-[12px] font-semibold min-w-[90px]">
                                <InputBase
                                    propsForm={{ name: "search_proveedor" }}
                                    placeholder="F1..."
                                    className="w-full !h-11 bg-yellow-50/50"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-1">
                            <LabelBase label="Observación:" orientation="row" className="w-full !text-[12px] font-semibold min-w-[100px]">
                                <InputBase
                                    propsForm={{ name: "observacion" }}
                                    placeholder="..."
                                    className="w-full !h-11 bg-yellow-50/50"
                                    formWithMessage={false}
                                />
                            </LabelBase>
                        </div>
                        <div className="col-span-3 flex items-center justify-start gap-3">
                            <Form.Item name="listar_no_anuladas" valuePropName="checked" noStyle>
                                <Checkbox className="!text-[11px] font-bold uppercase text-gray-600 whitespace-nowrap">
                                    NO ANULADAS
                                </Checkbox>
                            </Form.Item>
                            <ButtonBase
                                color="info"
                                size="md"
                                className="!h-11 flex items-center justify-center gap-2 !text-[12px] px-5"
                                type="submit"
                            >
                                <FaSearch size={13} /> Buscar
                            </ButtonBase>
                        </div>
                    </div>
                </div>
            </FormBase>
        </div>
    );
}
