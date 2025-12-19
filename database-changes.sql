-- ============================================
-- CAMBIOS EN LA BASE DE DATOS - COTIZACIONES
-- Fecha: 2025-12-19
-- ============================================

-- 1. Agregar campo reservar_stock a la tabla cotizacion
ALTER TABLE cotizacion 
ADD COLUMN reservar_stock TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Indica si se debe reservar el stock de los productos' 
AFTER estado_cotizacion;

-- 2. Verificar la estructura de la tabla cotizacion
DESCRIBE cotizacion;

-- 3. Ver las tablas relacionadas
DESCRIBE productoalmacencotizacion;
DESCRIBE unidadderivadainmutablecotizacion;

-- 4. Consulta para ver una cotización completa con sus productos
SELECT 
    c.id,
    c.numero,
    c.fecha,
    c.vigencia_dias,
    c.fecha_vencimiento,
    c.reservar_stock,
    c.estado_cotizacion,
    pac.id as producto_almacen_cotizacion_id,
    p.cod_producto,
    p.name as producto_name,
    udic.cantidad,
    udic.precio,
    udic.descuento,
    udic.recargo
FROM cotizacion c
LEFT JOIN productoalmacencotizacion pac ON c.id = pac.cotizacion_id
LEFT JOIN productoalmacen pa ON pac.producto_almacen_id = pa.id
LEFT JOIN producto p ON pa.producto_id = p.id
LEFT JOIN unidadderivadainmutablecotizacion udic ON pac.id = udic.producto_almacen_cotizacion_id
WHERE c.id = 'cot001'
LIMIT 10;

-- 5. Consulta para ver el stock actual de un producto
SELECT 
    p.cod_producto,
    p.name,
    pa.stock_fraccion,
    pa.almacen_id,
    a.name as almacen_name
FROM producto p
INNER JOIN productoalmacen pa ON p.id = pa.producto_id
INNER JOIN almacen a ON pa.almacen_id = a.id
WHERE p.cod_producto = 'AREGRU3';

-- 6. Rollback (si necesitas revertir el cambio)
-- ALTER TABLE cotizacion DROP COLUMN reservar_stock;


-- ============================================
-- AGREGAR CAMPOS FALTANTES A LA TABLA COTIZACION
-- ============================================

-- Agregar todos los campos que faltan del frontend
ALTER TABLE cotizacion 
ADD COLUMN vendedor VARCHAR(191) NULL COMMENT 'Nombre del vendedor' AFTER user_id,
ADD COLUMN forma_de_pago VARCHAR(50) NULL COMMENT 'Forma de pago (contado, credito, etc)' AFTER vendedor,
ADD COLUMN ruc_dni VARCHAR(20) NULL COMMENT 'RUC o DNI del cliente' AFTER cliente_id,
ADD COLUMN telefono VARCHAR(20) NULL COMMENT 'Teléfono del cliente' AFTER ruc_dni,
ADD COLUMN direccion TEXT NULL COMMENT 'Dirección del cliente' AFTER telefono,
ADD COLUMN tipo_documento VARCHAR(50) NULL COMMENT 'Tipo de documento (boleta, factura)' AFTER direccion,
ADD COLUMN fecha_proforma DATETIME(3) NULL COMMENT 'Fecha de la proforma' AFTER fecha;

-- Verificar que se agregaron correctamente
DESCRIBE cotizacion;

-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver todas las cotizaciones con reserva de stock
SELECT id, numero, fecha, reservar_stock, estado_cotizacion 
FROM cotizacion 
WHERE reservar_stock = 1;

-- Ver el stock actual vs reservado (cuando implementes la lógica)
SELECT 
    p.cod_producto,
    p.name,
    pa.stock_fraccion as stock_actual,
    pa.almacen_id
FROM producto p
INNER JOIN productoalmacen pa ON p.id = pa.producto_id
WHERE pa.almacen_id = 1
LIMIT 10;
