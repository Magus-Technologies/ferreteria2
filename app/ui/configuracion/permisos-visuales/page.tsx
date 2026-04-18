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
  Switch,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import { permissionsApi } from "~/lib/api/permissions";
import { usePermission } from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import NoAutorizado from "~/components/others/no-autorizado";
import { ConfigModeProvider } from "./_components/config-mode-context";
import { FaUsers, FaShieldAlt, FaUserShield } from 'react-icons/fa'
import { autorizacionesApi, autorizacionesKeys, type AutorizacionConfig } from '~/lib/api/autorizaciones'
import { apiRequest } from '~/lib/api'

// Importar JSONs de navegación
import facturacionElectronicaNav from "~/lib/navigation/module-navs/facturacion-electronica.json";
import gestionComercialNav from "~/lib/navigation/module-navs/gestion-comercial-e-inventario.json";

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
const CrearCotizacion = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/page"),
);
const CrearPrestamo = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-prestamos/crear-prestamo/page"),
);
const MisPrestamos = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-prestamos/page"),
);
const MisEntregas = lazy(
  () => import("~/app/ui/facturacion-electronica/mis-entregas/page"),
);

// Gestión Comercial e Inventario - vistas para modo configuración
const DashboardGestionComercial = lazy(
  () => import("~/app/ui/gestion-comercial-e-inventario/page"),
);
const CrearCompraGestionComercial = lazy(
  () => import("~/app/ui/gestion-comercial-e-inventario/mis-compras/crear-compra/page"),
);
const MisComprasGestionComercial = lazy(
  () => import("~/app/ui/gestion-comercial-e-inventario/mis-compras/page"),
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
  "facturacion-electronica.mis-entregas.index": "🚚",
  "facturacion-electronica.mis-cotizaciones.index": "💰",
  "facturacion-electronica.mis-guias.index": "📄",
  "facturacion-electronica.mis-prestamos.index": "💸",
  "facturacion-electronica.mis-notas.index": "📑",
  "facturacion-electronica.mis-contactos.index": "👥",
  "facturacion-electronica.mis-aperturas-cierres.index": "🔐",
  "facturacion-electronica.movimientos-caja.index": "💳",
  "gestion-comercial-e-inventario.mi-almacen.index": "📦",
  "gestion-comercial-e-inventario.dashboard.index": "📊",
  "gestion-comercial-e-inventario.mis-compras.index": "🛒",
  "gestion-comercial-e-inventario.mis-recepciones.index": "📥",
  "gestion-comercial-e-inventario.crear-compra.index": "📝",
  "producto.create": "📦",
  "proveedor.create": "🏢",
  "proveedor.listado": "🏢",
  "cliente.create": "👤",
  "caja.create": "🏦",
  "egreso-dinero.create": "💵",
};

// Etiquetas de área para el card de vista activa
const MODULE_LABELS: Record<string, string> = {
  "facturacion-electronica": "💰 Facturación Electrónica",
  "gestion-comercial-e-inventario": "📦 Gestión Comercial e Inventario",
  "gestion-contable": "📊 Gestión Contable y Financiera",
};

// Mapeo de permisos a componentes (vistas que se abren en modo configuración al hacer click)
const COMPONENT_MAP: Partial<Record<string, React.LazyExoticComponent<any>>> = {
  "facturacion-electronica.dashboard.index": DashboardFE,
  "facturacion-electronica.mis-ventas.index": MisVentas,
  "facturacion-electronica.crear-venta.index": CrearVenta,
  "facturacion-electronica.mis-entregas.index": MisEntregas,
  "facturacion-electronica.mis-guias.index": MisGuias,
  "facturacion-electronica.mis-cotizaciones.index": MisCotizaciones,
  "facturacion-electronica.crear-cotizacion.index": CrearCotizacion,
  "facturacion-electronica.crear-prestamo.index": CrearPrestamo,
  "facturacion-electronica.mis-prestamos.index": MisPrestamos,
  "gestion-comercial-e-inventario.dashboard.index": DashboardGestionComercial,
  "gestion-comercial-e-inventario.crear-compra.index": CrearCompraGestionComercial,
  "gestion-comercial-e-inventario.mis-compras.index": MisComprasGestionComercial,
};

// Mapeo de permisos de navegación a módulos de autorización
const PERMISSION_TO_AUTH_MODULO: Record<string, string> = {
  "facturacion-electronica.crear-venta.index": "ventas",
  "facturacion-electronica.mis-ventas.index": "ventas",
  "facturacion-electronica.crear-cotizacion.index": "cotizaciones",
  "facturacion-electronica.mis-cotizaciones.index": "cotizaciones",
  "facturacion-electronica.crear-prestamo.index": "prestamos",
  "facturacion-electronica.mis-prestamos.index": "prestamos",
  "facturacion-electronica.mis-guias.index": "guias",
  "facturacion-electronica.crear-guia.index": "guias",
  "facturacion-electronica.mis-entregas.index": "entregas",
  "facturacion-electronica.mis-contactos.index": "clientes",
  "facturacion-electronica.mis-aperturas-cierres.index": "caja",
  "facturacion-electronica.movimientos-caja.index": "caja",
  "gestion-comercial-e-inventario.mi-almacen.index": "productos",
  "gestion-comercial-e-inventario.crear-compra.index": "compras",
  "gestion-comercial-e-inventario.mis-compras.index": "compras",
  "gestion-comercial-e-inventario.mis-recepciones.index": "compras",
  "producto.create": "productos",
  "proveedor.create": "proveedores",
  "proveedor.listado": "proveedores",
  "cliente.create": "clientes",
  "caja.create": "caja",
  "egreso-dinero.create": "caja",
};

const ACCIONES = ['crear', 'editar', 'eliminar'] as const
type Accion = (typeof ACCIONES)[number]

const ACCION_COLORS: Record<Accion, string> = {
  crear: 'text-green-600',
  editar: 'text-blue-600',
  eliminar: 'text-red-600',
}

const ACCION_LABELS: Record<Accion, string> = {
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
}

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
  const [expandedPermission, setExpandedPermission] = useState<string | null>(null);

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

  // Cargar configs de autorización del rol
  const { data: configsResponse } = useQuery({
    queryKey: autorizacionesKeys.configs(rolSeleccionado ?? undefined),
    queryFn: () => autorizacionesApi.getConfigs(rolSeleccionado!),
    enabled: !!rolSeleccionado,
  })

  const authConfigs: AutorizacionConfig[] = (() => {
    const raw = configsResponse?.data
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as any).data)) return (raw as any).data
    return []
  })()

  // Cargar usuarios para selector de autorizador
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<any[]>('/autorizaciones/usuarios'),
    enabled: !!rolSeleccionado,
  })

  const users: { id: string; name: string }[] = (() => {
    const raw = usersResponse?.data
    if (Array.isArray(raw)) return raw
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as any).data)) return (raw as any).data
    return []
  })()

  // Mutation para guardar config de autorización
  const saveAuthMutation = useMutation({
    mutationFn: (data: {
      role_id: number
      modulo: string
      accion: Accion
      requiere_autorizacion: boolean
      autorizador_id?: string | null
    }) => autorizacionesApi.saveConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: autorizacionesKeys.configs(rolSeleccionado ?? undefined) })
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al guardar configuración')
    },
  })

  // Helpers de autorización
  const getAuthConfig = (modulo: string, accion: Accion): AutorizacionConfig | undefined => {
    return authConfigs.find(c => c.modulo === modulo && c.accion === accion)
  }

  const isRequiereAuth = (modulo: string, accion: Accion): boolean => {
    return getAuthConfig(modulo, accion)?.requiere_autorizacion ?? false
  }

  const getAutorizadorId = (modulo: string, accion: Accion): string | null => {
    return getAuthConfig(modulo, accion)?.autorizador_id ?? null
  }

  const handleAuthToggle = (modulo: string, accion: Accion, checked: boolean) => {
    if (!rolSeleccionado) return
    saveAuthMutation.mutate({
      role_id: rolSeleccionado,
      modulo,
      accion,
      requiere_autorizacion: checked,
      autorizador_id: getAutorizadorId(modulo, accion),
    })
  }

  const handleAutorizadorChange = (modulo: string, accion: Accion, autorizadorId: string | null) => {
    if (!rolSeleccionado) return
    saveAuthMutation.mutate({
      role_id: rolSeleccionado,
      modulo,
      accion,
      requiere_autorizacion: true,
      autorizador_id: autorizadorId,
    })
  }

  if (!canAccess) {
    return <NoAutorizado />;
  }

  const rolNombre = rolData?.descripcion || "Sin seleccionar";

  // Extraer todos los items de navegación con permisos
  const extraerItems = (items: any[]): NavItem[] => {
    const resultado: NavItem[] = [];

    items.forEach((item) => {
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
      return { topNav: topItems, bottomNav: bottomItems };
    }

    if (moduloSeleccionado === "gestion-comercial-e-inventario") {
      const topItems = extraerItems(gestionComercialNav.topNav.items);
      const bottomItems = extraerItems(gestionComercialNav.bottomNav.items);
      return { topNav: topItems, bottomNav: bottomItems };
    }

    return { topNav: [], bottomNav: [] };
  };

  const modulos = obtenerModulos();

  // Manejar click en módulo
  const handleModuloClick = (
    label: string,
    permission: string,
    hasComponent: boolean,
  ) => {
    if (!rolSeleccionado) {
      message.warning("Selecciona un rol primero");
      return;
    }

    if (hasComponent) {
      const component = COMPONENT_MAP[permission];
      if (component) {
        setVistaActiva({ label, permission, component });
      }
    } else {
      setItemSeleccionado({ label, permission });
      setModalVisible(true);
    }
  };

  const volverALista = () => {
    setVistaActiva(null);
  };

  // Mutation para guardar restricción de visibilidad
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
          ? `${rolNombre} VERA "${itemSeleccionado?.label}"`
          : `${rolNombre} NO VERA "${itemSeleccionado?.label}"`,
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

  const handleElementClick = (componentId: string, componentLabel: string) => {
    setItemSeleccionado({
      label: componentLabel,
      permission: componentId,
    });
    setModalVisible(true);
  };

  // Contar autorizaciones activas para un módulo de auth
  const countAuthActivas = (authModulo: string) => {
    return authConfigs.filter(c => c.modulo === authModulo && c.requiere_autorizacion).length
  }

  // Renderizar un card de módulo
  const renderModuloCard = (item: NavItem, idx: number) => {
    const visible = estaVisible(item.permission!);
    const icon = ICON_MAP[item.permission!] || "📌";
    const hasComponent = !!COMPONENT_MAP[item.permission!];
    const authModulo = PERMISSION_TO_AUTH_MODULO[item.permission!];
    const isExpanded = expandedPermission === item.permission;
    const authCount = authModulo ? countAuthActivas(authModulo) : 0;

    return (
      <div
        key={idx}
        className={`
          rounded-lg border-2 transition-all
          ${isExpanded ? "shadow-md" : ""}
          ${visible ? "border-green-300 bg-green-50 hover:border-green-400" : "border-red-300 bg-red-50 hover:border-red-400"}
        `}
      >
        {/* Header del card */}
        <div
          className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
          onClick={() => {
            if (!rolSeleccionado) {
              message.warning("Selecciona un rol primero");
              return;
            }
            setExpandedPermission(isExpanded ? null : item.permission!);
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Flechita de expand/collapse */}
            {authModulo ? (
              <span className={`text-[10px] text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                <DownOutlined />
              </span>
            ) : (
              <span className="w-[14px]" />
            )}
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-medium truncate">
              {item.label}
            </span>
            {authCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                {authCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasComponent && (
              <Button
                size="small"
                type="link"
                className="text-blue-500 p-0 h-auto text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuloClick(item.label || '', item.permission!, hasComponent);
                }}
              >
                Config. Vista
              </Button>
            )}
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setItemSeleccionado({ label: item.label || '', permission: item.permission! });
                setModalVisible(true);
              }}
            >
              {visible ? (
                <EyeOutlined className="text-green-600 flex-shrink-0" />
              ) : (
                <EyeInvisibleOutlined className="text-red-600 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Panel expandible con autorizaciones */}
        {isExpanded && authModulo && (
          <div className="px-3 pb-3 border-t border-gray-200 pt-2 bg-white/60 rounded-b-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <FaShieldAlt className="text-amber-500" size={12} />
              <span className="text-xs font-semibold text-gray-600">Requiere autorizaci&oacute;n para:</span>
            </div>
            <div className="space-y-2">
              {ACCIONES.map(accion => {
                const activo = isRequiereAuth(authModulo, accion)
                const autorizadorId = getAutorizadorId(authModulo, accion)

                return (
                  <div key={accion} className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-14 ${ACCION_COLORS[accion]}`}>
                      {ACCION_LABELS[accion]}
                    </span>
                    <Switch
                      size="small"
                      checked={activo}
                      onChange={(checked) => {
                        handleAuthToggle(authModulo, accion, checked)
                      }}
                      loading={saveAuthMutation.isPending}
                    />
                    {activo && (
                      <Select
                        size="small"
                        placeholder="Aprobador"
                        allowClear
                        className="flex-1 min-w-0"
                        value={autorizadorId || undefined}
                        onChange={(val) => handleAutorizadorChange(authModulo, accion, val || null)}
                        onClick={(e) => e.stopPropagation()}
                        options={users.map(u => ({
                          label: u.name?.split(' ')[0] || u.name,
                          value: u.id,
                        }))}
                        popupMatchSelectWidth={200}
                        optionRender={(option) => {
                          const user = users.find(u => u.id === option.value)
                          return (
                            <div className="flex items-center gap-2">
                              <FaUserShield className="text-blue-500" size={12} />
                              <span>{user?.name}</span>
                            </div>
                          )
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    );
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
                onChange={(val) => {
                  setRolSeleccionado(val);
                  setExpandedPermission(null);
                }}
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
                onChange={(val) => {
                  setModuloSeleccionado(val);
                  setExpandedPermission(null);
                }}
                options={[
                  {
                    label: "Facturación Electrónica",
                    value: "facturacion-electronica",
                  },
                  {
                    label: "Gestión Comercial e Inventario",
                    value: "gestion-comercial-e-inventario",
                  },
                  {
                    label: "Gestión Contable y Financiera",
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
            Selecciona un rol para empezar a configurar
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
              <div className="text-sm bg-blue-50 px-3 py-2 rounded border border-blue-200">
                <span className="text-gray-600">Rol:</span>{" "}
                <strong className="text-blue-600">{rolNombre}</strong>
                <Divider type="vertical" />
                <span className="text-gray-600">Área:</span>{" "}
                <strong>{MODULE_LABELS[moduloSeleccionado] ?? moduloSeleccionado}</strong>
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
            <div className="h-[calc(100vh-250px)] overflow-hidden">
              <Suspense
                fallback={<Spin size="large" tip="Cargando vista real..." />}
              >
                <vistaActiva.component />
              </Suspense>
            </div>
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
              {modulos.topNav.map((item, idx) => renderModuloCard(item, idx))}
            </div>
          </div>

          <Divider />

          {/* Bottom Navigation Modules */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="text-purple-500">🔽</span> Barra Inferior (Bottom Nav)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {modulos.bottomNav.map((item, idx) => renderModuloCard(item, idx))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 m-0">
              <strong>Nota:</strong> Haz click en un módulo para configurar sus autorizaciones (crear/editar/eliminar).
              Si no se selecciona un aprobador específico, cualquier administrador podrá aprobar.
            </p>
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
