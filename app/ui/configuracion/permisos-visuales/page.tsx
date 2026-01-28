"use client";

import { useState, lazy, Suspense } from "react";
import {
  Card,
  Select,
  Button,
  Modal,
  message,
  Spin,
  Divider,
  Alert,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import { permissionsApi } from "~/lib/api/permissions";
import { usePermission } from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import NoAutorizado from "~/components/others/no-autorizado";
import { ConfigModeProvider } from "./_components/config-mode-context";
import { FaUsers } from 'react-icons/fa'


// Importar JSONs de navegación
import facturacionElectronicaNav from "~/lib/navigation/module-navs/facturacion-electronica.json";

// Lazy load de vistas reales
const DashboardFE = lazy(() => import("~/app/ui/facturacion-electronica/page"));
const MisVentas = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-ventas/page"),
);
const CrearVenta = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-ventas/crear-venta/page"),
);
const MisGuias = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-guias/page"),
);
const MisCotizaciones = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-cotizaciones/page"),
);

interface NavItem {
  id?: string;
  key?: string;
  label?: string;
  permission?: string | null;
  route?: string | null;
  items?: any[];
  type?: string;
  icon?: string;
  action?: string;
}

// Mapeo de iconos
const ICON_MAP: Record<string, string> = {
  "facturacion-electronica.dashboard.index": "📊",
  "facturacion-electronica.crear-venta.index": "🏷️",
  "facturacion-electronica.crear-cotizacion.index": "📝",
  "facturacion-electronica.crear-prestamo.index": "🤝",
  "facturacion-electronica.crear-guia.index": "📋",
  "facturacion-electronica.mis-ventas.index": "🛒",
  "facturacion-electronica.mis-cotizaciones.index": "💰",
  "facturacion-electronica.mis-guias.index": "📄",
  "facturacion-electronica.mis-prestamos.index": "💸",
  "facturacion-electronica.mis-notas.index": "📑",
  "facturacion-electronica.mis-contactos.index": "👥",
  "facturacion-electronica.mis-aperturas-cierres.index": "🔐",
  "facturacion-electronica.movimientos-caja.index": "💳",
  "gestion-comercial-e-inventario.mi-almacen.index": "📦",
  "cliente.create": "👤",
  "caja.create": "🏦",
  "egreso-dinero.create": "💵",
};

// Mapeo de permisos a componentes
const COMPONENT_MAP: Partial<Record<string, React.LazyExoticComponent<any>>> = {
  "facturacion-electronica.dashboard.index": DashboardFE,
  "facturacion-electronica.mis-ventas.index": MisVentas,
  "facturacion-electronica.crear-venta.index": CrearVenta,
  "facturacion-electronica.mis-guias.index": MisGuias,
  "facturacion-electronica.mis-cotizaciones.index": MisCotizaciones,
};

export default function PermisosVisualesPage() {
  const canAccess = usePermission(permissions.CONFIGURACION_PERMISOS_INDEX);
  const queryClient = useQueryClient();

  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
  const [moduloSeleccionado, setModuloSeleccionado] = useState<string>(
    "facturacion-electronica",
  );
  const [vistaActiva, setVistaActiva] = useState<{
    label: string;
    permission: string;
    component: React.LazyExoticComponent<any>;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<{
    label: string;
    permission: string;
  } | null>(null);

  // Cargar roles
  const { data: rolesResponse, isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => permissionsApi.getRoles(),
  });
  const roles = (rolesResponse?.data as any)?.data || rolesResponse?.data || [];

  // Obtener restricciones del rol seleccionado
  const rolData = Array.isArray(roles)
    ? roles.find((r: any) => r.id === rolSeleccionado)
    : null;
  const restriccionesActivas = new Set<string>(
    rolData?.restrictions?.map((r: any) => r.name as string) || [],
  );

  if (!canAccess) {
    return <NoAutorizado />;
  }

  const rolNombre = rolData?.descripcion || "Sin seleccionar";

  // Extraer todos los items de navegación con permisos
  const extraerItems = (items: any[]): NavItem[] => {
    const resultado: NavItem[] = [];

    items.forEach((item) => {
      // Solo procesar items que tengan permission Y label (ignorar dividers y otros)
      if (item.permission && item.label) {
        resultado.push({
          label: item.label,
          permission: item.permission,
          route: item.route,
          icon: item.icon,
        });
      }

      if (item.items && Array.isArray(item.items)) {
        const subitems = extraerItems(item.items);
        resultado.push(...subitems);
      }
    });

    return resultado;
  };

  // Obtener módulos según selección
  const obtenerModulos = () => {
    if (moduloSeleccionado === "facturacion-electronica") {
      const topItems = extraerItems(facturacionElectronicaNav.topNav.items);
      const bottomItems = extraerItems(
        facturacionElectronicaNav.bottomNav.items,
      );

      return {
        topNav: topItems,
        bottomNav: bottomItems,
      };
    }

    return { topNav: [], bottomNav: [] };
  };

  const modulos = obtenerModulos();

  // Manejar click en módulo - Cargar vista real O mostrar modal
  const handleModuloClick = (
    label: string,
    permission: string,
    hasComponent: boolean,
  ) => {
    if (!rolSeleccionado) {
      message.warning("Selecciona un rol primero");
      return;
    }

    // Si el componente existe, cargar la vista real
    if (hasComponent) {
      const component = COMPONENT_MAP[permission];
      if (component) {
        setVistaActiva({ label, permission, component });
      }
    } else {
      // Si no tiene componente configurable, abrir modal para ocultar/mostrar
      setItemSeleccionado({ label, permission });
      setModalVisible(true);
    }
  };

  // Volver a lista de módulos
  const volverALista = () => {
    setVistaActiva(null);
  };

  // Mutation para guardar restricción
  const toggleMutation = useMutation({
    mutationFn: async ({ mostrar }: { mostrar: boolean }) => {
      if (!rolSeleccionado || !itemSeleccionado)
        throw new Error("Datos incompletos");

      return permissionsApi.toggleRestriction(
        rolSeleccionado,
        itemSeleccionado.permission,
        mostrar,
      );
    },
    onSuccess: (data, variables) => {
      const mostrar = variables.mostrar;
      message.success(
        mostrar
          ? `✅ ${rolNombre} VERÁ "${itemSeleccionado?.label}"`
          : `🚫 ${rolNombre} NO VERÁ "${itemSeleccionado?.label}"`,
      );

      setModalVisible(false);
      setItemSeleccionado(null);

      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: any) => {
      message.error(error?.message || "Error al guardar");
    },
  });

  const handleDecision = async (mostrar: boolean) => {
    toggleMutation.mutate({ mostrar });
  };

  const estaVisible = (permission: string) => {
    if (!rolSeleccionado) return true;
    return !restriccionesActivas.has(permission);
  };

  // Manejar click en elemento de la vista (botón, campo, etc)
  const handleElementClick = (componentId: string, componentLabel: string) => {
    setItemSeleccionado({
      label: componentLabel,
      permission: componentId,
    });
    setModalVisible(true);
  };

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Configurar Acceso a Módulos"
        icon={<FaUsers className='text-blue-600' />}
       
      />

      {!vistaActiva && (
        <Card className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Selector de Rol */}
            <div className="flex items-center gap-2">
              <label className="font-medium whitespace-nowrap">Rol:</label>
              <Select
                style={{ width: 200 }}
                placeholder="Selecciona rol"
                loading={loadingRoles}
                value={rolSeleccionado}
                onChange={setRolSeleccionado}
                options={
                  Array.isArray(roles)
                    ? roles.map((r: any) => ({
                        label: r.descripcion,
                        value: r.id,
                      }))
                    : []
                }
              />
            </div>

            <Divider type="vertical" className="h-8" />

            {/* Selector de Área */}
            <div className="flex items-center gap-2">
              <label className="font-medium whitespace-nowrap">Área:</label>
              <Select
                style={{ width: 250 }}
                value={moduloSeleccionado}
                onChange={setModuloSeleccionado}
                options={[
                  {
                    label: "💰 Facturación Electrónica",
                    value: "facturacion-electronica",
                  },
                  {
                    label: "📦 Gestión Comercial e Inventario",
                    value: "gestion-comercial",
                    disabled: true,
                  },
                  {
                    label: "📊 Gestión Contable y Financiera",
                    value: "gestion-contable",
                    disabled: true,
                  },
                ]}
              />
            </div>

            {rolSeleccionado && (
              <>
                <Divider type="vertical" className="h-8" />
                <div className="text-sm">
                  Configurando:{" "}
                  <strong className="text-blue-600">{rolNombre}</strong>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {!rolSeleccionado ? (
        <Card>
          <div className="text-center text-gray-500 py-8">
            👆 Selecciona un rol para empezar a configurar
          </div>
        </Card>
      ) : vistaActiva ? (
        <Card>
          {/* Vista Real Cargada */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button icon={<ArrowLeftOutlined />} onClick={volverALista}>
                Volver
              </Button>
              <span className="text-lg font-bold">{vistaActiva.label}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Info del rol al lado del alert */}
              <div className="text-sm bg-blue-50 px-3 py-2 rounded border border-blue-200">
                <span className="text-gray-600">Rol:</span>{" "}
                <strong className="text-blue-600">{rolNombre}</strong>
                <Divider type="vertical" />
                <span className="text-gray-600">Área:</span>{" "}
                <strong>💰 Facturación Electrónica</strong>
              </div>

              <Alert
                message="Modo Configuración Activo"
                description="Haz click en cualquier elemento para configurarlo"
                type="info"
                showIcon
                className="mb-0"
              />
            </div>
          </div>

          <ConfigModeProvider
            enabled={true}
            onTogglePermiso={handleElementClick}
            permisosActivos={restriccionesActivas}
          >
            <Suspense
              fallback={<Spin size="large" tip="Cargando vista real..." />}
            >
              <vistaActiva.component />
            </Suspense>
          </ConfigModeProvider>
        </Card>
      ) : (
        <Card>
          {/* Top Navigation Modules */}
          <div className="mb-6">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-500">🔼</span> Barra Superior (Top Nav)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {modulos.topNav.map((item, idx) => {
                const visible = estaVisible(item.permission!);
                const icon = ICON_MAP[item.permission!] || "📌";
                const hasComponent = !!COMPONENT_MAP[item.permission!];

                return (
                  <div
                    key={idx}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${visible ? "border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md" : "border-red-300 bg-red-50 hover:border-red-400 hover:shadow-md"}
                    `}
                    onClick={() =>
                      handleModuloClick(
                        item.label || '',
                        item.permission!,
                        hasComponent,
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
                      </div>
                      {visible ? (
                        <EyeOutlined className="text-green-600 flex-shrink-0" />
                      ) : (
                        <EyeInvisibleOutlined className="text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* Bottom Navigation Modules */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="text-purple-500">🔽</span> Barra Inferior (Bottom
              Nav)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {modulos.bottomNav.map((item, idx) => {
                const visible = estaVisible(item.permission!);
                const icon = ICON_MAP[item.permission!] || "📌";
                const hasComponent = !!COMPONENT_MAP[item.permission!];

                return (
                  <div
                    key={idx}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${visible ? "border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md" : "border-red-300 bg-red-50 hover:border-red-400 hover:shadow-md"}
                    `}
                    onClick={() =>
                      handleModuloClick(
                        item.label || '',
                        item.permission!,
                        hasComponent,
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
                      </div>
                      {visible ? (
                        <EyeOutlined className="text-green-600 flex-shrink-0" />
                      ) : (
                        <EyeInvisibleOutlined className="text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Modal de Decisión */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <div className="text-center py-6">
          <h3 className="text-xl font-bold mb-4">¿Mostrar u Ocultar?</h3>
          <p className="text-gray-600 mb-2">
            Elemento: <strong>{itemSeleccionado?.label}</strong>
          </p>
          <p className="text-gray-600 mb-6">
            Para el rol: <strong>{rolNombre}</strong>
          </p>

          <Divider />

          <div className="flex gap-4 justify-center">
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => handleDecision(true)}
              loading={toggleMutation.isPending}
              disabled={toggleMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              Mostrar
            </Button>
            <Button
              danger
              size="large"
              icon={<CloseCircleOutlined />}
              onClick={() => handleDecision(false)}
              loading={toggleMutation.isPending}
              disabled={toggleMutation.isPending}
            >
              Ocultar
            </Button>
          </div>
        </div>
      </Modal>
    </ContenedorGeneral>
  );
}
