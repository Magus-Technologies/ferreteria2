-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('01', '03', 'nv', 'in', 'sa', 'rc');

-- CreateEnum
CREATE TYPE "EstadoDeCompra" AS ENUM ('cr', 'ee', 'an', 'pr');

-- CreateEnum
CREATE TYPE "FormaDePago" AS ENUM ('co', 'cr');

-- CreateEnum
CREATE TYPE "TipoMoneda" AS ENUM ('s', 'd');

-- CreateTable
CREATE TABLE "Almacen" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacen" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "almacen_id" INTEGER NOT NULL,
    "stock_fraccion" DECIMAL(9,3) NOT NULL DEFAULT 0,
    "costo" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "ubicacion_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoAlmacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "almacen_id" INTEGER NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadDerivada" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UnidadDerivada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenUnidadDerivada" (
    "id" SERIAL NOT NULL,
    "producto_almacen_id" INTEGER NOT NULL,
    "unidad_derivada_id" INTEGER NOT NULL,
    "factor" DECIMAL(9,3) NOT NULL,
    "precio_publico" DECIMAL(9,3) NOT NULL,
    "comision_publico" DECIMAL(9,3) DEFAULT 0,
    "precio_especial" DECIMAL(9,3),
    "comision_especial" DECIMAL(9,3) DEFAULT 0,
    "activador_especial" DECIMAL(9,3),
    "precio_minimo" DECIMAL(9,3),
    "comision_minimo" DECIMAL(9,3) DEFAULT 0,
    "activador_minimo" DECIMAL(9,3),
    "precio_ultimo" DECIMAL(9,3),
    "comision_ultimo" DECIMAL(9,3) DEFAULT 0,
    "activador_ultimo" DECIMAL(9,3),

    CONSTRAINT "ProductoAlmacenUnidadDerivada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCaja" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SubCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetodoDePago" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuenta_bancaria" TEXT NOT NULL,
    "monto" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "subcaja_id" TEXT NOT NULL,

    CONSTRAINT "MetodoDePago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespliegueDePago" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metodo_de_pago_id" TEXT NOT NULL,

    CONSTRAINT "DespliegueDePago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL DEFAULT 'nv',
    "serie" TEXT,
    "numero" INTEGER,
    "descripcion" TEXT,
    "forma_de_pago" "FormaDePago" NOT NULL DEFAULT 'co',
    "tipo_moneda" "TipoMoneda" NOT NULL DEFAULT 's',
    "tipo_de_cambio" DECIMAL(9,4) NOT NULL DEFAULT 1,
    "percepcion" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "numero_dias" INTEGER,
    "fecha_vencimiento" TIMESTAMP(3),
    "fecha" TIMESTAMP(3) NOT NULL,
    "guia" TEXT,
    "user_id" TEXT NOT NULL,
    "almacen_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "proveedor_id" INTEGER,
    "estado_de_compra" "EstadoDeCompra" NOT NULL DEFAULT 'cr',

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenCompra" (
    "id" SERIAL NOT NULL,
    "compra_id" TEXT NOT NULL,
    "costo" DECIMAL(9,4) NOT NULL,
    "producto_almacen_id" INTEGER NOT NULL,

    CONSTRAINT "ProductoAlmacenCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadDerivadaInmutableCompra" (
    "id" SERIAL NOT NULL,
    "unidad_derivada_inmutable_id" INTEGER NOT NULL,
    "producto_almacen_compra_id" INTEGER NOT NULL,
    "factor" DECIMAL(9,3) NOT NULL,
    "cantidad" DECIMAL(9,3) NOT NULL,
    "cantidad_pendiente" DECIMAL(9,3) NOT NULL DEFAULT 0,
    "lote" TEXT,
    "vencimiento" TIMESTAMP(3),
    "flete" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "bonificacion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UnidadDerivadaInmutableCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadDerivadaInmutable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UnidadDerivadaInmutable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "almacen_id" INTEGER NOT NULL,
    "marca_id" INTEGER NOT NULL,
    "serie_ingreso" INTEGER NOT NULL DEFAULT 1,
    "serie_salida" INTEGER NOT NULL DEFAULT 1,
    "serie_recepcion_almacen" INTEGER NOT NULL DEFAULT 1,
    "ruc" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "efectivo" DECIMAL(9,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngresoSalida" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "serie" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "almacen_id" INTEGER NOT NULL,
    "tipo_ingreso_id" INTEGER NOT NULL,
    "proveedor_id" INTEGER,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngresoSalida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenIngresoSalida" (
    "id" SERIAL NOT NULL,
    "ingreso_id" INTEGER NOT NULL,
    "costo" DECIMAL(9,4) NOT NULL,
    "producto_almacen_id" INTEGER NOT NULL,

    CONSTRAINT "ProductoAlmacenIngresoSalida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadDerivadaInmutableIngresoSalida" (
    "id" SERIAL NOT NULL,
    "unidad_derivada_inmutable_id" INTEGER NOT NULL,
    "producto_almacen_ingreso_salida_id" INTEGER NOT NULL,
    "factor" DECIMAL(9,3) NOT NULL,
    "cantidad" DECIMAL(9,3) NOT NULL,
    "cantidad_restante" DECIMAL(9,3) NOT NULL,
    "lote" TEXT,
    "vencimiento" TIMESTAMP(3),

    CONSTRAINT "UnidadDerivadaInmutableIngresoSalida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialUnidadDerivadaInmutableIngresoSalida" (
    "id" SERIAL NOT NULL,
    "unidad_derivada_inmutable_ingreso_salida_id" INTEGER NOT NULL,
    "stock_anterior" DECIMAL(9,3) NOT NULL,
    "stock_nuevo" DECIMAL(9,3) NOT NULL,

    CONSTRAINT "HistorialUnidadDerivadaInmutableIngresoSalida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoIngresoSalida" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoIngresoSalida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "cod_producto" TEXT NOT NULL,
    "cod_barra" TEXT,
    "name" TEXT NOT NULL,
    "name_ticket" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "marca_id" INTEGER NOT NULL,
    "unidad_medida_id" INTEGER NOT NULL,
    "accion_tecnica" TEXT,
    "img" TEXT,
    "ficha_tecnica" TEXT,
    "stock_min" DECIMAL(9,3) NOT NULL,
    "stock_max" INTEGER,
    "unidades_contenidas" DECIMAL(9,3) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "permitido" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "razon_social" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendedor" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "cumple" TIMESTAMP(3),
    "proveedor_id" INTEGER NOT NULL,

    CONSTRAINT "Vendedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carro" (
    "id" SERIAL NOT NULL,
    "placa" TEXT NOT NULL,
    "proveedor_id" INTEGER NOT NULL,

    CONSTRAINT "Carro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chofer" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licencia" TEXT NOT NULL,
    "proveedor_id" INTEGER NOT NULL,

    CONSTRAINT "Chofer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecepcionAlmacen" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "transportista_razon_social" TEXT,
    "transportista_ruc" TEXT,
    "transportista_placa" TEXT,
    "transportista_licencia" TEXT,
    "transportista_dni" TEXT,
    "transportista_name" TEXT,
    "transportista_guia_remision" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT NOT NULL,
    "compra_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecepcionAlmacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenRecepcion" (
    "id" SERIAL NOT NULL,
    "recepcion_id" INTEGER NOT NULL,
    "costo" DECIMAL(9,4) NOT NULL,
    "producto_almacen_id" INTEGER NOT NULL,

    CONSTRAINT "ProductoAlmacenRecepcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadDerivadaInmutableRecepcion" (
    "id" SERIAL NOT NULL,
    "unidad_derivada_inmutable_id" INTEGER NOT NULL,
    "producto_almacen_recepcion_id" INTEGER NOT NULL,
    "factor" DECIMAL(9,3) NOT NULL,
    "cantidad" DECIMAL(9,3) NOT NULL,
    "cantidad_restante" DECIMAL(9,3) NOT NULL,
    "lote" TEXT,
    "vencimiento" TIMESTAMP(3),
    "flete" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "bonificacion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UnidadDerivadaInmutableRecepcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialUnidadDerivadaInmutableRecepcion" (
    "id" SERIAL NOT NULL,
    "unidad_derivada_inmutable_recepcion_id" INTEGER NOT NULL,
    "stock_anterior" DECIMAL(9,3) NOT NULL,
    "stock_nuevo" DECIMAL(9,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialUnidadDerivadaInmutableRecepcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "empresa_id" INTEGER NOT NULL,
    "efectivo" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PermissionToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Almacen_name_key" ON "Almacen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacen_producto_id_almacen_id_key" ON "ProductoAlmacen"("producto_id", "almacen_id");

-- CreateIndex
CREATE INDEX "Ubicacion_name_idx" ON "Ubicacion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ubicacion_almacen_id_name_key" ON "Ubicacion"("almacen_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadDerivada_name_key" ON "UnidadDerivada"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenUnidadDerivada_producto_almacen_id_unidad_de_key" ON "ProductoAlmacenUnidadDerivada"("producto_almacen_id", "unidad_derivada_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenUnidadDerivada_producto_almacen_id_factor_key" ON "ProductoAlmacenUnidadDerivada"("producto_almacen_id", "factor");

-- CreateIndex
CREATE UNIQUE INDEX "SubCaja_name_key" ON "SubCaja"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MetodoDePago_name_key" ON "MetodoDePago"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DespliegueDePago_name_key" ON "DespliegueDePago"("name");

-- CreateIndex
CREATE INDEX "Compra_fecha_idx" ON "Compra"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_serie_numero_proveedor_id_key" ON "Compra"("serie", "numero", "proveedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenCompra_compra_id_producto_almacen_id_key" ON "ProductoAlmacenCompra"("compra_id", "producto_almacen_id");

-- CreateIndex
CREATE INDEX "UnidadDerivadaInmutableCompra_cantidad_pendiente_idx" ON "UnidadDerivadaInmutableCompra"("cantidad_pendiente");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadDerivadaInmutableCompra_producto_almacen_compra_id_un_key" ON "UnidadDerivadaInmutableCompra"("producto_almacen_compra_id", "unidad_derivada_inmutable_id", "bonificacion");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadDerivadaInmutable_name_key" ON "UnidadDerivadaInmutable"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenIngresoSalida_ingreso_id_producto_almacen_id_key" ON "ProductoAlmacenIngresoSalida"("ingreso_id", "producto_almacen_id");

-- CreateIndex
CREATE UNIQUE INDEX "TipoIngresoSalida_name_key" ON "TipoIngresoSalida"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_cod_producto_key" ON "Producto"("cod_producto");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_cod_barra_key" ON "Producto"("cod_barra");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_name_key" ON "Producto"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_name_key" ON "Categoria"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_name_key" ON "Marca"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_name_key" ON "UnidadMedida"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_razon_social_key" ON "Proveedor"("razon_social");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_ruc_key" ON "Proveedor"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Vendedor_dni_key" ON "Vendedor"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Chofer_dni_key" ON "Chofer"("dni");

-- CreateIndex
CREATE INDEX "RecepcionAlmacen_fecha_idx" ON "RecepcionAlmacen"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenRecepcion_recepcion_id_producto_almacen_id_key" ON "ProductoAlmacenRecepcion"("recepcion_id", "producto_almacen_id");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadDerivadaInmutableRecepcion_producto_almacen_recepcion_key" ON "UnidadDerivadaInmutableRecepcion"("producto_almacen_recepcion_id", "unidad_derivada_inmutable_id", "bonificacion");

-- CreateIndex
CREATE INDEX "HistorialUnidadDerivadaInmutableRecepcion_created_at_idx" ON "HistorialUnidadDerivadaInmutableRecepcion"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE INDEX "_PermissionToUser_B_index" ON "_PermissionToUser"("B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "ProductoAlmacen" ADD CONSTRAINT "ProductoAlmacen_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacen" ADD CONSTRAINT "ProductoAlmacen_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacen" ADD CONSTRAINT "ProductoAlmacen_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenUnidadDerivada" ADD CONSTRAINT "ProductoAlmacenUnidadDerivada_producto_almacen_id_fkey" FOREIGN KEY ("producto_almacen_id") REFERENCES "ProductoAlmacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenUnidadDerivada" ADD CONSTRAINT "ProductoAlmacenUnidadDerivada_unidad_derivada_id_fkey" FOREIGN KEY ("unidad_derivada_id") REFERENCES "UnidadDerivada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetodoDePago" ADD CONSTRAINT "MetodoDePago_subcaja_id_fkey" FOREIGN KEY ("subcaja_id") REFERENCES "SubCaja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespliegueDePago" ADD CONSTRAINT "DespliegueDePago_metodo_de_pago_id_fkey" FOREIGN KEY ("metodo_de_pago_id") REFERENCES "MetodoDePago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenCompra" ADD CONSTRAINT "ProductoAlmacenCompra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenCompra" ADD CONSTRAINT "ProductoAlmacenCompra_producto_almacen_id_fkey" FOREIGN KEY ("producto_almacen_id") REFERENCES "ProductoAlmacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadDerivadaInmutableCompra" ADD CONSTRAINT "UnidadDerivadaInmutableCompra_unidad_derivada_inmutable_id_fkey" FOREIGN KEY ("unidad_derivada_inmutable_id") REFERENCES "UnidadDerivadaInmutable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadDerivadaInmutableCompra" ADD CONSTRAINT "UnidadDerivadaInmutableCompra_producto_almacen_compra_id_fkey" FOREIGN KEY ("producto_almacen_compra_id") REFERENCES "ProductoAlmacenCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngresoSalida" ADD CONSTRAINT "IngresoSalida_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngresoSalida" ADD CONSTRAINT "IngresoSalida_tipo_ingreso_id_fkey" FOREIGN KEY ("tipo_ingreso_id") REFERENCES "TipoIngresoSalida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngresoSalida" ADD CONSTRAINT "IngresoSalida_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngresoSalida" ADD CONSTRAINT "IngresoSalida_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenIngresoSalida" ADD CONSTRAINT "ProductoAlmacenIngresoSalida_ingreso_id_fkey" FOREIGN KEY ("ingreso_id") REFERENCES "IngresoSalida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenIngresoSalida" ADD CONSTRAINT "ProductoAlmacenIngresoSalida_producto_almacen_id_fkey" FOREIGN KEY ("producto_almacen_id") REFERENCES "ProductoAlmacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadDerivadaInmutableIngresoSalida" ADD CONSTRAINT "UnidadDerivadaInmutableIngresoSalida_unidad_derivada_inmut_fkey" FOREIGN KEY ("unidad_derivada_inmutable_id") REFERENCES "UnidadDerivadaInmutable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadDerivadaInmutableIngresoSalida" ADD CONSTRAINT "UnidadDerivadaInmutableIngresoSalida_producto_almacen_ingr_fkey" FOREIGN KEY ("producto_almacen_ingreso_salida_id") REFERENCES "ProductoAlmacenIngresoSalida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialUnidadDerivadaInmutableIngresoSalida" ADD CONSTRAINT "HistorialUnidadDerivadaInmutableIngresoSalida_unidad_deriv_fkey" FOREIGN KEY ("unidad_derivada_inmutable_ingreso_salida_id") REFERENCES "UnidadDerivadaInmutableIngresoSalida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "UnidadMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendedor" ADD CONSTRAINT "Vendedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carro" ADD CONSTRAINT "Carro_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chofer" ADD CONSTRAINT "Chofer_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionAlmacen" ADD CONSTRAINT "RecepcionAlmacen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionAlmacen" ADD CONSTRAINT "RecepcionAlmacen_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenRecepcion" ADD CONSTRAINT "ProductoAlmacenRecepcion_recepcion_id_fkey" FOREIGN KEY ("recepcion_id") REFERENCES "RecepcionAlmacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenRecepcion" ADD CONSTRAINT "ProductoAlmacenRecepcion_producto_almacen_id_fkey" FOREIGN KEY ("producto_almacen_id") REFERENCES "ProductoAlmacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadDerivadaInmutableRecepcion" ADD CONSTRAINT "UnidadDerivadaInmutableRecepcion_unidad_derivada_inmutable_fkey" FOREIGN KEY ("unidad_derivada_inmutable_id") REFERENCES "UnidadDerivadaInmutable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadDerivadaInmutableRecepcion" ADD CONSTRAINT "UnidadDerivadaInmutableRecepcion_producto_almacen_recepcio_fkey" FOREIGN KEY ("producto_almacen_recepcion_id") REFERENCES "ProductoAlmacenRecepcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialUnidadDerivadaInmutableRecepcion" ADD CONSTRAINT "HistorialUnidadDerivadaInmutableRecepcion_unidad_derivada__fkey" FOREIGN KEY ("unidad_derivada_inmutable_recepcion_id") REFERENCES "UnidadDerivadaInmutableRecepcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToUser" ADD CONSTRAINT "_PermissionToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToUser" ADD CONSTRAINT "_PermissionToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
