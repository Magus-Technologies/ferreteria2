-- CreateTable
CREATE TABLE `Almacen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Almacen_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoAlmacen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `producto_id` INTEGER NOT NULL,
    `almacen_id` INTEGER NOT NULL,
    `stock_fraccion` DECIMAL(9, 3) NOT NULL DEFAULT 0,
    `costo` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `ubicacion_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductoAlmacen_producto_id_almacen_id_key`(`producto_id`, `almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ubicacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `almacen_id` INTEGER NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Ubicacion_name_idx`(`name`),
    UNIQUE INDEX `Ubicacion_almacen_id_name_key`(`almacen_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadDerivada` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `UnidadDerivada_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoAlmacenUnidadDerivada` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `producto_almacen_id` INTEGER NOT NULL,
    `unidad_derivada_id` INTEGER NOT NULL,
    `factor` DECIMAL(9, 3) NOT NULL,
    `precio_publico` DECIMAL(9, 3) NOT NULL,
    `comision_publico` DECIMAL(9, 3) NULL DEFAULT 0,
    `precio_especial` DECIMAL(9, 3) NULL,
    `comision_especial` DECIMAL(9, 3) NULL DEFAULT 0,
    `activador_especial` DECIMAL(9, 3) NULL,
    `precio_minimo` DECIMAL(9, 3) NULL,
    `comision_minimo` DECIMAL(9, 3) NULL DEFAULT 0,
    `activador_minimo` DECIMAL(9, 3) NULL,
    `precio_ultimo` DECIMAL(9, 3) NULL,
    `comision_ultimo` DECIMAL(9, 3) NULL DEFAULT 0,
    `activador_ultimo` DECIMAL(9, 3) NULL,

    UNIQUE INDEX `ProductoAlmacenUnidadDerivada_producto_almacen_id_unidad_der_key`(`producto_almacen_id`, `unidad_derivada_id`),
    UNIQUE INDEX `ProductoAlmacenUnidadDerivada_producto_almacen_id_factor_key`(`producto_almacen_id`, `factor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubCaja` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SubCaja_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MetodoDePago` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cuenta_bancaria` VARCHAR(191) NULL,
    `monto` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    `subcaja_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MetodoDePago_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DespliegueDePago` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `adicional` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    `mostrar` BOOLEAN NOT NULL DEFAULT true,
    `metodo_de_pago_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `DespliegueDePago_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AperturaYCierreCaja` (
    `id` VARCHAR(191) NOT NULL,
    `fecha_apertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `monto_apertura` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    `fecha_cierre` DATETIME(3) NULL,
    `monto_cierre` DECIMAL(9, 2) NULL,
    `user_id` VARCHAR(191) NOT NULL,

    INDEX `AperturaYCierreCaja_fecha_apertura_idx`(`fecha_apertura`),
    INDEX `AperturaYCierreCaja_fecha_cierre_idx`(`fecha_cierre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo_cliente` ENUM('p', 'e') NOT NULL DEFAULT 'p',
    `numero_documento` VARCHAR(191) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `razon_social` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Cliente_numero_documento_key`(`numero_documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Compra` (
    `id` VARCHAR(191) NOT NULL,
    `tipo_documento` ENUM('01', '03', 'nv', 'in', 'sa', 'rc') NOT NULL DEFAULT 'nv',
    `serie` VARCHAR(191) NULL,
    `numero` INTEGER NULL,
    `descripcion` VARCHAR(191) NULL,
    `forma_de_pago` ENUM('co', 'cr') NOT NULL DEFAULT 'co',
    `tipo_moneda` ENUM('s', 'd') NOT NULL DEFAULT 's',
    `tipo_de_cambio` DECIMAL(9, 4) NOT NULL DEFAULT 1,
    `percepcion` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `numero_dias` INTEGER NULL,
    `fecha_vencimiento` DATETIME(3) NULL,
    `fecha` DATETIME(3) NOT NULL,
    `guia` VARCHAR(191) NULL,
    `estado_de_compra` ENUM('cr', 'ee', 'an', 'pr') NOT NULL DEFAULT 'cr',
    `egreso_dinero_id` VARCHAR(191) NULL,
    `despliegue_de_pago_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `almacen_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `proveedor_id` INTEGER NULL,

    INDEX `Compra_fecha_idx`(`fecha`),
    INDEX `Compra_estado_de_compra_idx`(`estado_de_compra`),
    INDEX `Compra_proveedor_id_idx`(`proveedor_id`),
    INDEX `Compra_almacen_id_idx`(`almacen_id`),
    INDEX `Compra_user_id_idx`(`user_id`),
    INDEX `Compra_created_at_idx`(`created_at`),
    UNIQUE INDEX `Compra_serie_numero_proveedor_id_key`(`serie`, `numero`, `proveedor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoAlmacenCompra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `compra_id` VARCHAR(191) NOT NULL,
    `costo` DECIMAL(9, 4) NOT NULL,
    `producto_almacen_id` INTEGER NOT NULL,

    UNIQUE INDEX `ProductoAlmacenCompra_compra_id_producto_almacen_id_key`(`compra_id`, `producto_almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadDerivadaInmutableCompra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unidad_derivada_inmutable_id` INTEGER NOT NULL,
    `producto_almacen_compra_id` INTEGER NOT NULL,
    `factor` DECIMAL(9, 3) NOT NULL,
    `cantidad` DECIMAL(9, 3) NOT NULL,
    `cantidad_pendiente` DECIMAL(9, 3) NOT NULL,
    `lote` VARCHAR(191) NULL,
    `vencimiento` DATETIME(3) NULL,
    `flete` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `bonificacion` BOOLEAN NOT NULL DEFAULT false,

    INDEX `UnidadDerivadaInmutableCompra_cantidad_pendiente_idx`(`cantidad_pendiente`),
    UNIQUE INDEX `UnidadDerivadaInmutableCompra_producto_almacen_compra_id_uni_key`(`producto_almacen_compra_id`, `unidad_derivada_inmutable_id`, `bonificacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadDerivadaInmutable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `UnidadDerivadaInmutable_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PagoDeCompra` (
    `id` VARCHAR(191) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `compra_id` VARCHAR(191) NOT NULL,
    `despliegue_de_pago_id` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(9, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cotizacion` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `vigencia_dias` INTEGER NOT NULL DEFAULT 7,
    `fecha_vencimiento` DATETIME(3) NOT NULL,
    `tipo_moneda` ENUM('s', 'd') NOT NULL DEFAULT 's',
    `tipo_de_cambio` DECIMAL(9, 4) NOT NULL DEFAULT 1,
    `observaciones` TEXT NULL,
    `estado_cotizacion` ENUM('pe', 'co', 've', 'ca') NOT NULL DEFAULT 'pe',
    `cliente_id` INTEGER NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `almacen_id` INTEGER NOT NULL,
    `venta_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cotizacion_numero_key`(`numero`),
    UNIQUE INDEX `Cotizacion_venta_id_key`(`venta_id`),
    INDEX `Cotizacion_fecha_idx`(`fecha`),
    INDEX `Cotizacion_estado_cotizacion_idx`(`estado_cotizacion`),
    INDEX `Cotizacion_cliente_id_idx`(`cliente_id`),
    INDEX `Cotizacion_almacen_id_idx`(`almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoAlmacenCotizacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cotizacion_id` VARCHAR(191) NOT NULL,
    `costo` DECIMAL(9, 4) NOT NULL,
    `producto_almacen_id` INTEGER NOT NULL,

    UNIQUE INDEX `ProductoAlmacenCotizacion_cotizacion_id_producto_almacen_id_key`(`cotizacion_id`, `producto_almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadDerivadaInmutableCotizacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unidad_derivada_inmutable_id` INTEGER NOT NULL,
    `producto_almacen_cotizacion_id` INTEGER NOT NULL,
    `factor` DECIMAL(9, 3) NOT NULL,
    `cantidad` DECIMAL(9, 3) NOT NULL,
    `precio` DECIMAL(9, 4) NOT NULL,
    `recargo` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `descuento_tipo` ENUM('%', 'm') NOT NULL DEFAULT 'm',
    `descuento` DECIMAL(9, 4) NOT NULL DEFAULT 0,

    UNIQUE INDEX `UnidadDerivadaInmutableCotizacion_producto_almacen_cotizacio_key`(`producto_almacen_cotizacion_id`, `unidad_derivada_inmutable_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `almacen_id` INTEGER NOT NULL,
    `marca_id` INTEGER NOT NULL,
    `serie_ingreso` INTEGER NOT NULL DEFAULT 1,
    `serie_salida` INTEGER NOT NULL DEFAULT 1,
    `serie_recepcion_almacen` INTEGER NOT NULL DEFAULT 1,
    `ruc` VARCHAR(191) NOT NULL,
    `razon_social` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EntregaProducto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venta_id` VARCHAR(191) NOT NULL,
    `tipo_entrega` ENUM('in', 'pr') NOT NULL DEFAULT 'in',
    `tipo_despacho` ENUM('et', 'do') NOT NULL DEFAULT 'et',
    `estado_entrega` ENUM('pe', 'ec', 'en', 'ca') NOT NULL DEFAULT 'pe',
    `fecha_entrega` DATETIME(3) NOT NULL,
    `fecha_programada` DATETIME(3) NULL,
    `hora_inicio` VARCHAR(191) NULL,
    `hora_fin` VARCHAR(191) NULL,
    `direccion_entrega` VARCHAR(191) NULL,
    `observaciones` VARCHAR(191) NULL,
    `almacen_salida_id` INTEGER NOT NULL,
    `chofer_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `EntregaProducto_venta_id_idx`(`venta_id`),
    INDEX `EntregaProducto_fecha_entrega_idx`(`fecha_entrega`),
    INDEX `EntregaProducto_estado_entrega_idx`(`estado_entrega`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleEntregaProducto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entrega_producto_id` INTEGER NOT NULL,
    `unidad_derivada_venta_id` INTEGER NOT NULL,
    `cantidad_entregada` DECIMAL(9, 3) NOT NULL,
    `ubicacion` VARCHAR(191) NULL,

    UNIQUE INDEX `DetalleEntregaProducto_entrega_producto_id_unidad_derivada_vent`(`entrega_producto_id`, `unidad_derivada_venta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IngresoSalida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo_documento` ENUM('01', '03', 'nv', 'in', 'sa', 'rc') NOT NULL,
    `serie` INTEGER NOT NULL,
    `numero` INTEGER NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `almacen_id` INTEGER NOT NULL,
    `tipo_ingreso_id` INTEGER NOT NULL,
    `proveedor_id` INTEGER NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoAlmacenIngresoSalida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ingreso_id` INTEGER NOT NULL,
    `costo` DECIMAL(9, 4) NOT NULL,
    `producto_almacen_id` INTEGER NOT NULL,

    UNIQUE INDEX `ProductoAlmacenIngresoSalida_ingreso_id_producto_almacen_id_key`(`ingreso_id`, `producto_almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadDerivadaInmutableIngresoSalida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unidad_derivada_inmutable_id` INTEGER NOT NULL,
    `producto_almacen_ingreso_salida_id` INTEGER NOT NULL,
    `factor` DECIMAL(9, 3) NOT NULL,
    `cantidad` DECIMAL(9, 3) NOT NULL,
    `cantidad_restante` DECIMAL(9, 3) NOT NULL,
    `lote` VARCHAR(191) NULL,
    `vencimiento` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistorialUnidadDerivadaInmutableIngresoSalida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unidad_derivada_inmutable_ingreso_salida_id` INTEGER NOT NULL,
    `stock_anterior` DECIMAL(9, 3) NOT NULL,
    `stock_nuevo` DECIMAL(9, 3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoIngresoSalida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `TipoIngresoSalida_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Permission_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cod_producto` VARCHAR(191) NOT NULL,
    `cod_barra` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `name_ticket` VARCHAR(191) NOT NULL,
    `categoria_id` INTEGER NOT NULL,
    `marca_id` INTEGER NOT NULL,
    `unidad_medida_id` INTEGER NOT NULL,
    `accion_tecnica` TEXT NULL,
    `img` VARCHAR(191) NULL,
    `ficha_tecnica` VARCHAR(191) NULL,
    `stock_min` DECIMAL(9, 3) NOT NULL,
    `stock_max` INTEGER NULL,
    `unidades_contenidas` DECIMAL(9, 3) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `permitido` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Producto_cod_producto_key`(`cod_producto`),
    UNIQUE INDEX `Producto_cod_barra_key`(`cod_barra`),
    UNIQUE INDEX `Producto_name_key`(`name`),
    INDEX `Producto_name_idx`(`name`),
    INDEX `Producto_categoria_id_idx`(`categoria_id`),
    INDEX `Producto_marca_id_idx`(`marca_id`),
    INDEX `Producto_estado_idx`(`estado`),
    INDEX `Producto_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Categoria_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Marca` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Marca_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadMedida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `UnidadMedida_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proveedor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `razon_social` VARCHAR(191) NOT NULL,
    `ruc` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Proveedor_razon_social_key`(`razon_social`),
    UNIQUE INDEX `Proveedor_ruc_key`(`ruc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vendedor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni` VARCHAR(191) NOT NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `cumple` DATETIME(3) NULL,
    `proveedor_id` INTEGER NOT NULL,

    UNIQUE INDEX `Vendedor_dni_key`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Carro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `placa` VARCHAR(191) NOT NULL,
    `proveedor_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chofer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dni` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `licencia` VARCHAR(191) NOT NULL,
    `proveedor_id` INTEGER NOT NULL,

    UNIQUE INDEX `Chofer_dni_key`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecepcionAlmacen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` INTEGER NOT NULL,
    `observaciones` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL,
    `transportista_razon_social` VARCHAR(191) NULL,
    `transportista_ruc` VARCHAR(191) NULL,
    `transportista_placa` VARCHAR(191) NULL,
    `transportista_licencia` VARCHAR(191) NULL,
    `transportista_dni` VARCHAR(191) NULL,
    `transportista_name` VARCHAR(191) NULL,
    `transportista_guia_remision` VARCHAR(191) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `user_id` VARCHAR(191) NOT NULL,
    `compra_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `RecepcionAlmacen_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoAlmacenRecepcion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recepcion_id` INTEGER NOT NULL,
    `costo` DECIMAL(9, 4) NOT NULL,
    `producto_almacen_id` INTEGER NOT NULL,

    UNIQUE INDEX `ProductoAlmacenRecepcion_recepcion_id_producto_almacen_id_key`(`recepcion_id`, `producto_almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadDerivadaInmutableRecepcion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unidad_derivada_inmutable_id` INTEGER NOT NULL,
    `producto_almacen_recepcion_id` INTEGER NOT NULL,
    `factor` DECIMAL(9, 3) NOT NULL,
    `cantidad` DECIMAL(9, 3) NOT NULL,
    `cantidad_restante` DECIMAL(9, 3) NOT NULL,
    `lote` VARCHAR(191) NULL,
    `vencimiento` DATETIME(3) NULL,
    `flete` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `bonificacion` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `UnidadDerivadaInmutableRecepcion_producto_almacen_recepcion__key`(`producto_almacen_recepcion_id`, `unidad_derivada_inmutable_id`, `bonificacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistorialUnidadDerivadaInmutableRecepcion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unidad_derivada_inmutable_recepcion_id` INTEGER NOT NULL,
    `stock_anterior` DECIMAL(9, 3) NOT NULL,
    `stock_nuevo` DECIMAL(9, 3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HistorialUnidadDerivadaInmutableRecepcion_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SerieDocumento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo_documento` ENUM('01', '03', 'nv', 'in', 'sa', 'rc') NOT NULL,
    `serie` VARCHAR(191) NOT NULL,
    `correlativo` INTEGER NOT NULL DEFAULT 0,
    `almacen_id` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `SerieDocumento_almacen_id_tipo_documento_activo_idx`(`almacen_id`, `tipo_documento`, `activo`),
    UNIQUE INDEX `SerieDocumento_tipo_documento_serie_almacen_id_key`(`tipo_documento`, `serie`, `almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `empresa_id` INTEGER NOT NULL,
    `efectivo` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` VARCHAR(191) NULL,
    `access_token` VARCHAR(191) NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` VARCHAR(191) NULL,
    `session_state` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`provider`, `providerAccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    PRIMARY KEY (`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Authenticator` (
    `credentialID` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `credentialPublicKey` VARCHAR(191) NOT NULL,
    `counter` INTEGER NOT NULL,
    `credentialDeviceType` VARCHAR(191) NOT NULL,
    `credentialBackedUp` BOOLEAN NOT NULL,
    `transports` VARCHAR(191) NULL,

    UNIQUE INDEX `Authenticator_credentialID_key`(`credentialID`),
    PRIMARY KEY (`userId`, `credentialID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IngresoDinero` (
    `id` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    `observaciones` VARCHAR(191) NULL,
    `despliegue_de_pago_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EgresoDinero` (
    `id` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    `vuelto` DECIMAL(9, 2) NULL,
    `observaciones` VARCHAR(191) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `despliegue_de_pago_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EgresoDinero_vuelto_idx`(`vuelto`),
    INDEX `EgresoDinero_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Venta` (
    `id` VARCHAR(191) NOT NULL,
    `tipo_documento` ENUM('01', '03', 'nv', 'in', 'sa', 'rc') NOT NULL DEFAULT 'nv',
    `serie` VARCHAR(191) NULL,
    `numero` INTEGER NULL,
    `descripcion` VARCHAR(191) NULL,
    `forma_de_pago` ENUM('co', 'cr') NOT NULL DEFAULT 'co',
    `tipo_moneda` ENUM('s', 'd') NOT NULL DEFAULT 's',
    `tipo_de_cambio` DECIMAL(9, 4) NOT NULL DEFAULT 1,
    `fecha` DATETIME(3) NOT NULL,
    `estado_de_venta` ENUM('cr', 'ee', 'an', 'pr') NOT NULL DEFAULT 'cr',
    `cliente_id` INTEGER NULL,
    `recomendado_por_id` INTEGER NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `almacen_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Venta_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DespliegueDePagoVenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venta_id` VARCHAR(191) NOT NULL,
    `despliegue_de_pago_id` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(9, 4) NOT NULL,

    UNIQUE INDEX `DespliegueDePagoVenta_venta_id_despliegue_de_pago_id_key`(`venta_id`, `despliegue_de_pago_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoAlmacenVenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `venta_id` VARCHAR(191) NOT NULL,
    `costo` DECIMAL(9, 4) NOT NULL,
    `producto_almacen_id` INTEGER NOT NULL,

    UNIQUE INDEX `ProductoAlmacenVenta_venta_id_producto_almacen_id_key`(`venta_id`, `producto_almacen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnidadDerivadaInmutableVenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unidad_derivada_inmutable_id` INTEGER NOT NULL,
    `producto_almacen_venta_id` INTEGER NOT NULL,
    `factor` DECIMAL(9, 3) NOT NULL,
    `cantidad` DECIMAL(9, 3) NOT NULL,
    `cantidad_pendiente` DECIMAL(9, 3) NOT NULL,
    `precio` DECIMAL(9, 4) NOT NULL,
    `recargo` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `descuento_tipo` ENUM('%', 'm') NOT NULL DEFAULT 'm',
    `descuento` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `comision` DECIMAL(9, 4) NOT NULL DEFAULT 0,

    UNIQUE INDEX `UnidadDerivadaInmutableVenta_producto_almacen_venta_id_unida_key`(`producto_almacen_venta_id`, `unidad_derivada_inmutable_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PermissionToRole` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_PermissionToRole_AB_unique`(`A`, `B`),
    INDEX `_PermissionToRole_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PermissionToUser` (
    `A` INTEGER NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_PermissionToUser_AB_unique`(`A`, `B`),
    INDEX `_PermissionToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RoleToUser` (
    `A` INTEGER NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_RoleToUser_AB_unique`(`A`, `B`),
    INDEX `_RoleToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductoAlmacen` ADD CONSTRAINT `ProductoAlmacen_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacen` ADD CONSTRAINT `ProductoAlmacen_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `Producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacen` ADD CONSTRAINT `ProductoAlmacen_ubicacion_id_fkey` FOREIGN KEY (`ubicacion_id`) REFERENCES `Ubicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ubicacion` ADD CONSTRAINT `Ubicacion_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenUnidadDerivada` ADD CONSTRAINT `ProductoAlmacenUnidadDerivada_producto_almacen_id_fkey` FOREIGN KEY (`producto_almacen_id`) REFERENCES `ProductoAlmacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenUnidadDerivada` ADD CONSTRAINT `ProductoAlmacenUnidadDerivada_unidad_derivada_id_fkey` FOREIGN KEY (`unidad_derivada_id`) REFERENCES `UnidadDerivada`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MetodoDePago` ADD CONSTRAINT `MetodoDePago_subcaja_id_fkey` FOREIGN KEY (`subcaja_id`) REFERENCES `SubCaja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DespliegueDePago` ADD CONSTRAINT `DespliegueDePago_metodo_de_pago_id_fkey` FOREIGN KEY (`metodo_de_pago_id`) REFERENCES `MetodoDePago`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AperturaYCierreCaja` ADD CONSTRAINT `AperturaYCierreCaja_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_despliegue_de_pago_id_fkey` FOREIGN KEY (`despliegue_de_pago_id`) REFERENCES `DespliegueDePago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_egreso_dinero_id_fkey` FOREIGN KEY (`egreso_dinero_id`) REFERENCES `EgresoDinero`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `Proveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenCompra` ADD CONSTRAINT `ProductoAlmacenCompra_compra_id_fkey` FOREIGN KEY (`compra_id`) REFERENCES `Compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenCompra` ADD CONSTRAINT `ProductoAlmacenCompra_producto_almacen_id_fkey` FOREIGN KEY (`producto_almacen_id`) REFERENCES `ProductoAlmacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableCompra` ADD CONSTRAINT `UnidadDerivadaInmutableCompra_producto_almacen_compra_id_fkey` FOREIGN KEY (`producto_almacen_compra_id`) REFERENCES `ProductoAlmacenCompra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableCompra` ADD CONSTRAINT `UnidadDerivadaInmutableCompra_unidad_derivada_inmutable_id_fkey` FOREIGN KEY (`unidad_derivada_inmutable_id`) REFERENCES `UnidadDerivadaInmutable`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoDeCompra` ADD CONSTRAINT `PagoDeCompra_compra_id_fkey` FOREIGN KEY (`compra_id`) REFERENCES `Compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoDeCompra` ADD CONSTRAINT `PagoDeCompra_despliegue_de_pago_id_fkey` FOREIGN KEY (`despliegue_de_pago_id`) REFERENCES `DespliegueDePago`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cotizacion` ADD CONSTRAINT `Cotizacion_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cotizacion` ADD CONSTRAINT `Cotizacion_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cotizacion` ADD CONSTRAINT `Cotizacion_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cotizacion` ADD CONSTRAINT `Cotizacion_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `Venta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenCotizacion` ADD CONSTRAINT `ProductoAlmacenCotizacion_producto_almacen_id_fkey` FOREIGN KEY (`producto_almacen_id`) REFERENCES `ProductoAlmacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenCotizacion` ADD CONSTRAINT `ProductoAlmacenCotizacion_cotizacion_id_fkey` FOREIGN KEY (`cotizacion_id`) REFERENCES `Cotizacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableCotizacion` ADD CONSTRAINT `UnidadDerivadaInmutableCotizacion_producto_almacen_cotizaci_fkey` FOREIGN KEY (`producto_almacen_cotizacion_id`) REFERENCES `ProductoAlmacenCotizacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableCotizacion` ADD CONSTRAINT `UnidadDerivadaInmutableCotizacion_unidad_derivada_inmutable_fkey` FOREIGN KEY (`unidad_derivada_inmutable_id`) REFERENCES `UnidadDerivadaInmutable`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Empresa` ADD CONSTRAINT `Empresa_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Empresa` ADD CONSTRAINT `Empresa_marca_id_fkey` FOREIGN KEY (`marca_id`) REFERENCES `Marca`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntregaProducto` ADD CONSTRAINT `EntregaProducto_almacen_salida_id_fkey` FOREIGN KEY (`almacen_salida_id`) REFERENCES `Almacen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntregaProducto` ADD CONSTRAINT `EntregaProducto_chofer_id_fkey` FOREIGN KEY (`chofer_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntregaProducto` ADD CONSTRAINT `EntregaProducto_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EntregaProducto` ADD CONSTRAINT `EntregaProducto_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `Venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleEntregaProducto` ADD CONSTRAINT `DetalleEntregaProducto_entrega_producto_id_fkey` FOREIGN KEY (`entrega_producto_id`) REFERENCES `EntregaProducto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleEntregaProducto` ADD CONSTRAINT `DetalleEntregaProducto_unidad_derivada_venta_id_fkey` FOREIGN KEY (`unidad_derivada_venta_id`) REFERENCES `UnidadDerivadaInmutableVenta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngresoSalida` ADD CONSTRAINT `IngresoSalida_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngresoSalida` ADD CONSTRAINT `IngresoSalida_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `Proveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngresoSalida` ADD CONSTRAINT `IngresoSalida_tipo_ingreso_id_fkey` FOREIGN KEY (`tipo_ingreso_id`) REFERENCES `TipoIngresoSalida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngresoSalida` ADD CONSTRAINT `IngresoSalida_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenIngresoSalida` ADD CONSTRAINT `ProductoAlmacenIngresoSalida_ingreso_id_fkey` FOREIGN KEY (`ingreso_id`) REFERENCES `IngresoSalida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenIngresoSalida` ADD CONSTRAINT `ProductoAlmacenIngresoSalida_producto_almacen_id_fkey` FOREIGN KEY (`producto_almacen_id`) REFERENCES `ProductoAlmacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableIngresoSalida` ADD CONSTRAINT `UnidadDerivadaInmutableIngresoSalida_producto_almacen_ingre_fkey` FOREIGN KEY (`producto_almacen_ingreso_salida_id`) REFERENCES `ProductoAlmacenIngresoSalida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableIngresoSalida` ADD CONSTRAINT `UnidadDerivadaInmutableIngresoSalida_unidad_derivada_inmuta_fkey` FOREIGN KEY (`unidad_derivada_inmutable_id`) REFERENCES `UnidadDerivadaInmutable`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistorialUnidadDerivadaInmutableIngresoSalida` ADD CONSTRAINT `HistorialUnidadDerivadaInmutableIngresoSalida_unidad_deriva_fkey` FOREIGN KEY (`unidad_derivada_inmutable_ingreso_salida_id`) REFERENCES `UnidadDerivadaInmutableIngresoSalida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `Categoria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_marca_id_fkey` FOREIGN KEY (`marca_id`) REFERENCES `Marca`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_unidad_medida_id_fkey` FOREIGN KEY (`unidad_medida_id`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vendedor` ADD CONSTRAINT `Vendedor_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `Proveedor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Carro` ADD CONSTRAINT `Carro_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `Proveedor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chofer` ADD CONSTRAINT `Chofer_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `Proveedor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecepcionAlmacen` ADD CONSTRAINT `RecepcionAlmacen_compra_id_fkey` FOREIGN KEY (`compra_id`) REFERENCES `Compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecepcionAlmacen` ADD CONSTRAINT `RecepcionAlmacen_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenRecepcion` ADD CONSTRAINT `ProductoAlmacenRecepcion_producto_almacen_id_fkey` FOREIGN KEY (`producto_almacen_id`) REFERENCES `ProductoAlmacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenRecepcion` ADD CONSTRAINT `ProductoAlmacenRecepcion_recepcion_id_fkey` FOREIGN KEY (`recepcion_id`) REFERENCES `RecepcionAlmacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableRecepcion` ADD CONSTRAINT `UnidadDerivadaInmutableRecepcion_producto_almacen_recepcion_fkey` FOREIGN KEY (`producto_almacen_recepcion_id`) REFERENCES `ProductoAlmacenRecepcion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableRecepcion` ADD CONSTRAINT `UnidadDerivadaInmutableRecepcion_unidad_derivada_inmutable__fkey` FOREIGN KEY (`unidad_derivada_inmutable_id`) REFERENCES `UnidadDerivadaInmutable`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistorialUnidadDerivadaInmutableRecepcion` ADD CONSTRAINT `HistorialUnidadDerivadaInmutableRecepcion_unidad_derivada_i_fkey` FOREIGN KEY (`unidad_derivada_inmutable_recepcion_id`) REFERENCES `UnidadDerivadaInmutableRecepcion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SerieDocumento` ADD CONSTRAINT `SerieDocumento_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `Empresa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Authenticator` ADD CONSTRAINT `Authenticator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngresoDinero` ADD CONSTRAINT `IngresoDinero_despliegue_de_pago_id_fkey` FOREIGN KEY (`despliegue_de_pago_id`) REFERENCES `DespliegueDePago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IngresoDinero` ADD CONSTRAINT `IngresoDinero_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EgresoDinero` ADD CONSTRAINT `EgresoDinero_despliegue_de_pago_id_fkey` FOREIGN KEY (`despliegue_de_pago_id`) REFERENCES `DespliegueDePago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EgresoDinero` ADD CONSTRAINT `EgresoDinero_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_almacen_id_fkey` FOREIGN KEY (`almacen_id`) REFERENCES `Almacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_recomendado_por_id_fkey` FOREIGN KEY (`recomendado_por_id`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DespliegueDePagoVenta` ADD CONSTRAINT `DespliegueDePagoVenta_despliegue_de_pago_id_fkey` FOREIGN KEY (`despliegue_de_pago_id`) REFERENCES `DespliegueDePago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DespliegueDePagoVenta` ADD CONSTRAINT `DespliegueDePagoVenta_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `Venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenVenta` ADD CONSTRAINT `ProductoAlmacenVenta_producto_almacen_id_fkey` FOREIGN KEY (`producto_almacen_id`) REFERENCES `ProductoAlmacen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoAlmacenVenta` ADD CONSTRAINT `ProductoAlmacenVenta_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `Venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableVenta` ADD CONSTRAINT `UnidadDerivadaInmutableVenta_producto_almacen_venta_id_fkey` FOREIGN KEY (`producto_almacen_venta_id`) REFERENCES `ProductoAlmacenVenta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UnidadDerivadaInmutableVenta` ADD CONSTRAINT `UnidadDerivadaInmutableVenta_unidad_derivada_inmutable_id_fkey` FOREIGN KEY (`unidad_derivada_inmutable_id`) REFERENCES `UnidadDerivadaInmutable`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_A_fkey` FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_B_fkey` FOREIGN KEY (`B`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToUser` ADD CONSTRAINT `_PermissionToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToUser` ADD CONSTRAINT `_PermissionToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RoleToUser` ADD CONSTRAINT `_RoleToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RoleToUser` ADD CONSTRAINT `_RoleToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
