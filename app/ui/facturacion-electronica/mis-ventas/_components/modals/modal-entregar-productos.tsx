"use client";

import { Form, message, Modal } from "antd";
import { useState, useEffect } from "react";
import TitleForm from "~/components/form/title-form";
import type { getVentaResponseProps } from "~/lib/api/venta";
import useCreateEntrega from "../../_hooks/use-create-entrega";
import dayjs from "dayjs";
import 'dayjs/locale/es';
import { useAuth } from "~/lib/auth-context";
import ModalCreateCliente from "./modal-create-cliente";
import ModalSeleccionarProductosEntrega from "./modal-seleccionar-productos-entrega";
import ButtonBase from "~/components/buttons/button-base";
import type { Cliente } from "~/lib/api/cliente";
import { TipoEntrega, TipoDespacho, EstadoEntrega } from "~/lib/api/entrega-producto";
import FormDespachoEnTienda from "../forms/form-despacho-en-tienda";
import FormDespachoDomicilio from "../forms/form-despacho-domicilio";

// Configurar dayjs en español
dayjs.locale('es');

interface ModalEntregarProductosProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  venta?: getVentaResponseProps;
  tipoDespacho: "EnTienda" | "Domicilio" | "Parcial";
}

interface FormValues {
  tipo_despacho: "EnTienda" | "Domicilio" | "Parcial";
  quien_entrega?: "vendedor" | "almacen";
  chofer_id?: string | number; // Puede ser string o number
  fecha_programada?: Date;
  hora_inicio?: string;
  hora_fin?: string;
  direccion_entrega?: string;
  direccion?: string;
  direccion_seleccionada?: 'D1' | 'D2' | 'D3' | 'D4';
  _cliente_direccion_1?: string;
  _cliente_direccion_2?: string;
  _cliente_direccion_3?: string;
  _cliente_direccion_4?: string;
  observaciones?: string;
}

interface DatosProgramacion {
  chofer_id?: string | number;
  fecha_programada?: Date;
  hora_inicio?: string;
  hora_fin?: string;
  direccion_entrega?: string;
  observaciones?: string;
  quien_entrega?: "vendedor" | "almacen";
}

export default function ModalEntregarProductos({
  open,
  setOpen,
  venta,
  tipoDespacho: tipoDespachoInicial,
}: ModalEntregarProductosProps) {
  const [form] = Form.useForm<FormValues>();
  const { user } = useAuth();

  const [tipoDespacho, setTipoDespacho] = useState<"EnTienda" | "Domicilio" | "Parcial">(
    tipoDespachoInicial
  );
  const [modalEditarClienteOpen, setModalEditarClienteOpen] = useState(false);
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [datosProgramacion, setDatosProgramacion] = useState<DatosProgramacion | undefined>();

  // Actualizar tipoDespacho cuando cambia la prop
  useEffect(() => {
    setTipoDespacho(tipoDespachoInicial);
  }, [tipoDespachoInicial]);

  const { crearEntrega, loading } = useCreateEntrega({
    onSuccess: () => {
      setModalProductosOpen(false);
      setOpen(false);
      form.resetFields();
      setDatosProgramacion(undefined);
    },
  });

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (open && venta) {
      // Determinar la dirección correcta según direccion_seleccionada
      let direccionInicial = '';
      let seleccionInicial: 'D1' | 'D2' | 'D3' | 'D4' = 'D1';
      
      if (venta.direccion_seleccionada) {
        seleccionInicial = venta.direccion_seleccionada as 'D1' | 'D2' | 'D3' | 'D4';
        switch (venta.direccion_seleccionada) {
          case 'D1':
            direccionInicial = venta.cliente?.direccion || '';
            break;
          case 'D2':
            direccionInicial = venta.cliente?.direccion_2 || '';
            break;
          case 'D3':
            direccionInicial = venta.cliente?.direccion_3 || '';
            break;
          case 'D4':
            direccionInicial = venta.cliente?.direccion_4 || '';
            break;
          default:
            direccionInicial = venta.cliente?.direccion || '';
        }
      } else {
        // Si no hay direccion_seleccionada, usar la primera disponible
        direccionInicial = venta.cliente?.direccion || '';
      }

      form.setFieldsValue({
        tipo_despacho: "EnTienda",
        direccion_entrega: direccionInicial,
        direccion: direccionInicial,
        direccion_seleccionada: seleccionInicial,
        // Campos ocultos con las direcciones del cliente
        _cliente_direccion_1: venta.cliente?.direccion || '',
        _cliente_direccion_2: venta.cliente?.direccion_2 || '',
        _cliente_direccion_3: venta.cliente?.direccion_3 || '',
        _cliente_direccion_4: venta.cliente?.direccion_4 || '',
      });
      
      console.log('🔧 Formulario inicializado');
      console.log('🔧 Valores iniciales:', form.getFieldsValue());
    } else if (!open) {
      form.resetFields();
      // NO resetear datosProgramacion aquí porque puede estar en transición al modal de productos
      // Solo se resetea cuando el usuario cancela explícitamente
    }
  }, [open, venta, form]);

  const handleContinuar = async () => {
    try {
      // Obtener valores primero
      const values = form.getFieldsValue();
      
      console.log('📝 TODOS los valores del formulario:', values);
      console.log('🚚 Chofer ID específico:', values.chofer_id);
      console.log('📅 Fecha:', values.fecha_programada);
      console.log('⏰ Hora Inicio:', values.hora_inicio);
      console.log('⏰ Hora Fin:', values.hora_fin);
      console.log('📍 Dirección:', values.direccion_entrega);

      // Validaciones según tipo de despacho
      if (tipoDespacho === "EnTienda") {
        if (!values.quien_entrega) {
          message.error("Debe seleccionar quién entrega");
          return;
        }
      }

      if (tipoDespacho === "Domicilio" || tipoDespacho === "Parcial") {
        if (!values.chofer_id) {
          console.error('❌ chofer_id está vacío o undefined');
          message.error("Debe seleccionar un chofer");
          return;
        }
        if (!values.fecha_programada) {
          message.error("Debe seleccionar una fecha");
          return;
        }
        if (!values.hora_inicio) {
          message.error("Debe seleccionar hora de inicio");
          return;
        }
        if (!values.hora_fin) {
          message.error("Debe seleccionar hora de fin");
          return;
        }
        if (!values.direccion_entrega) {
          message.error("Debe ingresar una dirección");
          return;
        }
      }

      console.log('✅ Todas las validaciones pasaron');

      // Guardar datos de programación
      setDatosProgramacion({
        chofer_id: values.chofer_id,
        fecha_programada: values.fecha_programada,
        hora_inicio: values.hora_inicio,
        hora_fin: values.hora_fin,
        direccion_entrega: values.direccion_entrega,
        observaciones: values.observaciones,
        quien_entrega: values.quien_entrega,
      });

      // Cerrar este modal y abrir el de productos
      console.log('🔄 Cerrando modal actual y abriendo modal de productos...');
      setOpen(false);
      setModalProductosOpen(true);
      console.log('✅ modalProductosOpen ahora debería ser true');
    } catch (error) {
      console.error('❌ Error en handleContinuar:', error);
      message.error("Ocurrió un error. Revise la consola.");
    }
  };

  const handleConfirmarProductos = (data: {
    almacen_salida_id: number;
    productos: Array<{
      unidad_derivada_venta_id: number;
      cantidad_entregada: number;
      ubicacion?: string;
    }>;
  }) => {
    console.log('🎯 handleConfirmarProductos llamado con data:', data);
    console.log('🔍 venta:', !!venta, 'user?.id:', user?.id, 'datosProgramacion:', datosProgramacion);
    if (!venta || !user?.id || !datosProgramacion) {
      console.error('❌ Faltan datos requeridos - venta:', !!venta, 'user?.id:', user?.id, 'datosProgramacion:', !!datosProgramacion);
      return;
    }

    // Determinar tipo_entrega según el tipo de despacho
    let tipo_entrega: TipoEntrega;
    if (tipoDespacho === "EnTienda") {
      tipo_entrega = TipoEntrega.RECOJO_EN_TIENDA;
    } else if (tipoDespacho === "Parcial") {
      tipo_entrega = TipoEntrega.PARCIAL;
    } else {
      tipo_entrega = TipoEntrega.DESPACHO;
    }

    // Determinar tipo_despacho
    const tipo_despacho = tipoDespacho === "EnTienda" 
      ? TipoDespacho.INMEDIATO 
      : TipoDespacho.PROGRAMADO;

    // Determinar estado_entrega
    const estado_entrega = tipoDespacho === "EnTienda" 
      ? EstadoEntrega.ENTREGADO 
      : EstadoEntrega.PENDIENTE;

    crearEntrega({
      venta_id: venta.id,
      tipo_entrega,
      tipo_despacho,
      estado_entrega,
      fecha_entrega: dayjs().format('YYYY-MM-DD'),
      fecha_programada: datosProgramacion.fecha_programada ? dayjs(datosProgramacion.fecha_programada).format('YYYY-MM-DD') : undefined,
      hora_inicio: datosProgramacion.hora_inicio,
      hora_fin: datosProgramacion.hora_fin,
      direccion_entrega: datosProgramacion.direccion_entrega,
      observaciones: datosProgramacion.observaciones,
      almacen_salida_id: data.almacen_salida_id,
      chofer_id: (tipoDespacho === "Domicilio" || tipoDespacho === "Parcial") && datosProgramacion.chofer_id 
        ? String(datosProgramacion.chofer_id) 
        : undefined,
      quien_entrega: tipoDespacho === "EnTienda" && datosProgramacion.quien_entrega ? datosProgramacion.quien_entrega as any : undefined,
      user_id: user.id,
      productos_entregados: data.productos,
    });

    // Cerrar modal de productos
    setModalProductosOpen(false);
  };

  return (
    <>
      <Modal
        title={
          <TitleForm className="!pb-0">
            {tipoDespacho === "EnTienda" && "🏪 DESPACHO EN TIENDA"}
            {tipoDespacho === "Domicilio" && "🚚 DESPACHO A DOMICILIO"}
            {tipoDespacho === "Parcial" && "📦 DESPACHO PARCIAL"}
            {venta && (
              <div className="text-sm font-normal text-gray-600 mt-1">
                FACTURA DE CLIENTE N° {venta.serie}-{venta.numero}
              </div>
            )}
          </TitleForm>
        }
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setDatosProgramacion(undefined);
        }}
        width={900}
        centered
        style={{ top: 20 }}
        footer={
          <div className="flex justify-end gap-2">
            <ButtonBase
              color="default"
              size="md"
              onClick={() => {
                setOpen(false);
                form.resetFields();
                setDatosProgramacion(undefined);
              }}
            >
              Cancelar
            </ButtonBase>
            <ButtonBase
              color="info"
              size="md"
              onClick={handleContinuar}
            >
              Continuar →
            </ButtonBase>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4">
            {/* Despacho en Tienda */}
            {tipoDespacho === "EnTienda" && <FormDespachoEnTienda form={form} />}

            {/* Despacho a Domicilio o Parcial */}
            {(tipoDespacho === "Domicilio" || tipoDespacho === "Parcial") && (
              <FormDespachoDomicilio
                form={form}
                tipoDespacho={tipoDespacho}
                clienteNombre={
                  venta?.cliente?.razon_social ||
                  `${venta?.cliente?.nombres || ''} ${venta?.cliente?.apellidos || ''}`.trim()
                }
                clienteDirecciones={{
                  direccion: venta?.cliente?.direccion,
                  direccion_2: venta?.cliente?.direccion_2,
                  direccion_3: venta?.cliente?.direccion_3,
                  direccion_4: venta?.cliente?.direccion_4,
                }}
                direccionSeleccionada={venta?.direccion_seleccionada as 'D1' | 'D2' | 'D3' | 'D4' | undefined}
                onEditarCliente={() => setModalEditarClienteOpen(true)}
              />
            )}
          </div>
        </Form>
      </Modal>

      <ModalSeleccionarProductosEntrega
        open={modalProductosOpen}
        setOpen={setModalProductosOpen}
        venta={venta}
        tipoDespacho={tipoDespacho}
        datosProgramacion={datosProgramacion}
        onConfirmar={handleConfirmarProductos}
        loading={loading}
      />

      <ModalCreateCliente
        open={modalEditarClienteOpen}
        setOpen={setModalEditarClienteOpen}
        dataEdit={venta?.cliente}
        onSuccess={(cliente) => {
          // Actualizar la dirección en el formulario si el usuario editó el cliente
          const direccionPrincipal = cliente.direcciones?.find(d => d.es_principal);
          if (direccionPrincipal) {
            form.setFieldValue("direccion_entrega", direccionPrincipal.direccion);
          } else if (cliente.direcciones && cliente.direcciones.length > 0) {
            form.setFieldValue("direccion_entrega", cliente.direcciones[0].direccion);
          }
          setModalEditarClienteOpen(false);
        }}
      />
    </>
  );
}
