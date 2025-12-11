-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('in', 'pr');

-- CreateEnum
CREATE TYPE "TipoDespacho" AS ENUM ('et', 'do');

-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('pe', 'ec', 'en', 'ca');

-- CreateTable
CREATE TABLE "EntregaProducto" (
    "id" SERIAL NOT NULL,
    "venta_id" TEXT NOT NULL,
    "tipo_entrega" "TipoEntrega" NOT NULL DEFAULT 'in',
    "tipo_despacho" "TipoDespacho" NOT NULL DEFAULT 'et',
    "estado_entrega" "EstadoEntrega" NOT NULL DEFAULT 'pe',
    "fecha_entrega" TIMESTAMP(3) NOT NULL,
    "fecha_programada" TIMESTAMP(3),
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "direccion_entrega" TEXT,
    "observaciones" TEXT,
    "almacen_salida_id" INTEGER NOT NULL,
    "chofer_id" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntregaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleEntregaProducto" (
    "id" SERIAL NOT NULL,
    "entrega_producto_id" INTEGER NOT NULL,
    "unidad_derivada_venta_id" INTEGER NOT NULL,
    "cantidad_entregada" DECIMAL(9,3) NOT NULL,
    "ubicacion" TEXT,

    CONSTRAINT "DetalleEntregaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntregaProducto_venta_id_idx" ON "EntregaProducto"("venta_id");

-- CreateIndex
CREATE INDEX "EntregaProducto_fecha_entrega_idx" ON "EntregaProducto"("fecha_entrega");

-- CreateIndex
CREATE INDEX "EntregaProducto_estado_entrega_idx" ON "EntregaProducto"("estado_entrega");

-- CreateIndex
CREATE UNIQUE INDEX "DetalleEntregaProducto_entrega_producto_id_unidad_derivada_venta_id_key" ON "DetalleEntregaProducto"("entrega_producto_id", "unidad_derivada_venta_id");

-- AddForeignKey
ALTER TABLE "EntregaProducto" ADD CONSTRAINT "EntregaProducto_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProducto" ADD CONSTRAINT "EntregaProducto_almacen_salida_id_fkey" FOREIGN KEY ("almacen_salida_id") REFERENCES "Almacen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProducto" ADD CONSTRAINT "EntregaProducto_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProducto" ADD CONSTRAINT "EntregaProducto_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleEntregaProducto" ADD CONSTRAINT "DetalleEntregaProducto_entrega_producto_id_fkey" FOREIGN KEY ("entrega_producto_id") REFERENCES "EntregaProducto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleEntregaProducto" ADD CONSTRAINT "DetalleEntregaProducto_unidad_derivada_venta_id_fkey" FOREIGN KEY ("unidad_derivada_venta_id") REFERENCES "UnidadDerivadaInmutableVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
