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
    "costo" DECIMAL(9,3) NOT NULL DEFAULT 0,
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

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadDerivada" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UnidadDerivada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenUnidadDerivada" (
    "id" SERIAL NOT NULL,
    "producto_almacen_id" INTEGER NOT NULL,
    "unidad_derivada_id" INTEGER NOT NULL,
    "factor" DECIMAL(9,3) NOT NULL,
    "precio_principal" DECIMAL(9,3) NOT NULL,
    "comision_principal" DECIMAL(9,3),

    CONSTRAINT "ProductoAlmacenUnidadDerivada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenUnidadDerivadaPrecio" (
    "id" SERIAL NOT NULL,
    "producto_almacen_unidad_derivada_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "precio" DECIMAL(9,3) NOT NULL,
    "comision" DECIMAL(9,3),
    "activador" DECIMAL(9,3),

    CONSTRAINT "ProductoAlmacenUnidadDerivadaPrecio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" SERIAL NOT NULL,
    "almacen_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenUnidadDerivadaCompra" (
    "id" SERIAL NOT NULL,
    "compra_id" INTEGER NOT NULL,
    "producto_almacen_unidad_derivada_id" INTEGER NOT NULL,
    "cantidad" DECIMAL(9,3) NOT NULL,
    "lote" TEXT,
    "vencimiento" TIMESTAMP(3),

    CONSTRAINT "ProductoAlmacenUnidadDerivadaCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoAlmacenCompra" (
    "id" SERIAL NOT NULL,
    "compra_id" INTEGER NOT NULL,
    "costo" DECIMAL(9,3) NOT NULL,
    "producto_almacen_id" INTEGER NOT NULL,

    CONSTRAINT "ProductoAlmacenCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "almacen_id" INTEGER NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
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
    "cod_barra" TEXT,
    "name" TEXT NOT NULL,
    "name_ticket" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "marca_id" INTEGER NOT NULL,
    "unidad_medida_id" INTEGER NOT NULL,
    "accion_tecnica" TEXT,
    "stock_min" INTEGER NOT NULL,
    "unidades_contenidas" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Almacen_name_idx" ON "Almacen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacen_producto_id_almacen_id_key" ON "ProductoAlmacen"("producto_id", "almacen_id");

-- CreateIndex
CREATE INDEX "Ubicacion_name_idx" ON "Ubicacion"("name");

-- CreateIndex
CREATE INDEX "UnidadDerivada_name_idx" ON "UnidadDerivada"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenUnidadDerivada_producto_almacen_id_unidad_de_key" ON "ProductoAlmacenUnidadDerivada"("producto_almacen_id", "unidad_derivada_id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenUnidadDerivada_producto_almacen_id_factor_key" ON "ProductoAlmacenUnidadDerivada"("producto_almacen_id", "factor");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoAlmacenUnidadDerivadaPrecio_producto_almacen_unidad_key" ON "ProductoAlmacenUnidadDerivadaPrecio"("producto_almacen_unidad_derivada_id", "name");

-- CreateIndex
CREATE INDEX "Compra_created_at_idx" ON "Compra"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_cod_barra_key" ON "Producto"("cod_barra");

-- CreateIndex
CREATE INDEX "Producto_name_idx" ON "Producto"("name");

-- CreateIndex
CREATE INDEX "Categoria_name_idx" ON "Categoria"("name");

-- CreateIndex
CREATE INDEX "Marca_name_idx" ON "Marca"("name");

-- CreateIndex
CREATE INDEX "UnidadMedida_name_idx" ON "UnidadMedida"("name");

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
ALTER TABLE "ProductoAlmacen" ADD CONSTRAINT "ProductoAlmacen_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacen" ADD CONSTRAINT "ProductoAlmacen_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacen" ADD CONSTRAINT "ProductoAlmacen_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenUnidadDerivada" ADD CONSTRAINT "ProductoAlmacenUnidadDerivada_producto_almacen_id_fkey" FOREIGN KEY ("producto_almacen_id") REFERENCES "ProductoAlmacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenUnidadDerivada" ADD CONSTRAINT "ProductoAlmacenUnidadDerivada_unidad_derivada_id_fkey" FOREIGN KEY ("unidad_derivada_id") REFERENCES "UnidadDerivada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenUnidadDerivadaPrecio" ADD CONSTRAINT "ProductoAlmacenUnidadDerivadaPrecio_producto_almacen_unida_fkey" FOREIGN KEY ("producto_almacen_unidad_derivada_id") REFERENCES "ProductoAlmacenUnidadDerivada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenUnidadDerivadaCompra" ADD CONSTRAINT "ProductoAlmacenUnidadDerivadaCompra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenUnidadDerivadaCompra" ADD CONSTRAINT "ProductoAlmacenUnidadDerivadaCompra_producto_almacen_unida_fkey" FOREIGN KEY ("producto_almacen_unidad_derivada_id") REFERENCES "ProductoAlmacenUnidadDerivada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenCompra" ADD CONSTRAINT "ProductoAlmacenCompra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoAlmacenCompra" ADD CONSTRAINT "ProductoAlmacenCompra_producto_almacen_id_fkey" FOREIGN KEY ("producto_almacen_id") REFERENCES "ProductoAlmacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "UnidadMedida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
