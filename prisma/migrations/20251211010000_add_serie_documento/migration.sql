-- CreateTable
CREATE TABLE "SerieDocumento" (
    "id" SERIAL NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "serie" TEXT NOT NULL,
    "correlativo" INTEGER NOT NULL DEFAULT 0,
    "almacen_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SerieDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SerieDocumento_almacen_id_tipo_documento_activo_idx" ON "SerieDocumento"("almacen_id", "tipo_documento", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "SerieDocumento_tipo_documento_serie_almacen_id_key" ON "SerieDocumento"("tipo_documento", "serie", "almacen_id");

-- AddForeignKey
ALTER TABLE "SerieDocumento" ADD CONSTRAINT "SerieDocumento_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "Almacen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
