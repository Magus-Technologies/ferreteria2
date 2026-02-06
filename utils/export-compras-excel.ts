import { utils, writeFile } from "xlsx-js-style";
import { type Compra } from "~/lib/api/compra";
import dayjs from 'dayjs';

interface ExportComprasExcelParams {
  compras: Compra[];
  nameFile: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function exportComprasToExcel({ compras, nameFile, fechaDesde, fechaHasta }: ExportComprasExcelParams) {
  if (!compras || compras.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  // Función helper para calcular el subtotal de una compra
  const getSubTotal = (productos: Compra['productos_por_almacen']) => {
    if (!productos || productos.length === 0) return 0;

    let total = 0;
    for (const item of productos) {
      const costo = Number(item.costo ?? 0);
      for (const u of item.unidades_derivadas ?? []) {
        const cantidad = Number(u.cantidad ?? 0);
        const factor = Number(u.factor ?? 0);
        const flete = Number(u.flete ?? 0);
        const bonificacion = Boolean(u.bonificacion);
        const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete;
        total += montoLinea;
      }
    }
    return total;
  };

  // Preparar datos para Excel
  const data: any[][] = [];

  // ENCABEZADO DEL SISTEMA
  data.push(['Sistema de FxFerreterias2.2 (Software Ferretero Con aplicaciones de benchmarking)']);
  data.push(['', '', '', '', '', '', '', '', '', '', `Fecha Desde: ${fechaDesde || dayjs().format('DD/MM/YYYY')}`]);
  data.push(['', '', '', '', '', '', '', '', '', '', `Hasta: ${fechaHasta || dayjs().format('DD/MM/YYYY')}`]);
  
  // TÍTULO DEL REPORTE
  data.push(['REPORTE GENERAL DE COMPRAS - CONTABILIDAD']);
  
  // FILTROS
  data.push(['Forma de Pago (contado=cont y Credito=Cred): Todos', '', '', '', '', '', 'Estado de Compras (Deuda=D y Pagado=P): Todos']);
  
  // Fila vacía
  data.push([]);

  // ENCABEZADOS DE COLUMNAS
  data.push(['Fecha', 'M.', 'T.Doc', 'F.vence', 'Serie', 'Numero', 'Ruc', 'Proveedor', 'Percepcion', 'Pv', 'EstCompra', 'Abono', 'Saldo']);

  // Variables para totales
  let totalPercepcion = 0;
  let totalPv = 0;
  let totalAbono = 0;
  let totalSaldo = 0;

  // DATOS
  compras.forEach((compra) => {
    const total = getSubTotal(compra.productos_por_almacen);
    const percepcion = Number(compra.percepcion || 0);
    const totalPagado = Number(compra.total_pagado || 0);
    const saldo = total - totalPagado;

    // Acumular totales
    totalPercepcion += percepcion;
    totalPv += total;
    totalAbono += totalPagado;
    totalSaldo += saldo;

    // Determinar estado de compra
    let estadoCompra = '';
    const formaDePago = compra.forma_de_pago as string;
    if (formaDePago === 'co') {
      estadoCompra = 'CONP'; // Contado Pagado
    } else if (formaDePago === 'cr') {
      if (saldo <= 0.01) {
        estadoCompra = 'CONP'; // Crédito Pagado
      } else {
        estadoCompra = 'CRED'; // Crédito con Deuda
      }
    }

    data.push([
      dayjs(compra.fecha).format('DD/MM/YYYY'),
      compra.tipo_moneda === 'd' ? 'D' : 'S/', // Moneda
      String(compra.tipo_documento || ''),
      compra.fecha_vencimiento ? dayjs(compra.fecha_vencimiento).format('DD/MM/YYYY') : '',
      compra.serie || '',
      compra.numero || '',
      compra.proveedor?.ruc || '',
      compra.proveedor?.razon_social || '',
      Number(percepcion.toFixed(2)),
      Number(total.toFixed(2)),
      estadoCompra,
      Number(totalPagado.toFixed(2)),
      Number(saldo.toFixed(2)),
    ]);
  });

  // FILA DE TOTALES
  data.push([
    '', '', '', '', '', '', '', 'RESUMEN TOTAL DE COMPRAS',
    Number(totalPercepcion.toFixed(2)),
    Number(totalPv.toFixed(2)),
    '',
    Number(totalAbono.toFixed(2)),
    Number(totalSaldo.toFixed(2)),
  ]);

  // Crear hoja de cálculo
  const ws = utils.aoa_to_sheet(data);

  // ESTILOS

  // Título principal (fila 1)
  ws['A1'].s = {
    font: { bold: true, sz: 12 },
    alignment: { horizontal: "center", vertical: "center" },
  };

  // Fechas (filas 2 y 3)
  ws['K2'].s = { alignment: { horizontal: "right" } };
  ws['K3'].s = { alignment: { horizontal: "right" } };

  // Título del reporte (fila 4)
  ws['A4'].s = {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
  };

  // Filtros (fila 5)
  ws['A5'].s = { alignment: { horizontal: "left" } };
  ws['G5'].s = { alignment: { horizontal: "left" } };

  // Encabezados de columnas (fila 7)
  const headerRow = 7;
  for (let col = 0; col < 13; col++) {
    const cellRef = utils.encode_cell({ r: headerRow - 1, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 10 },
        fill: { fgColor: { rgb: "D9D9D9" } },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  // Datos (desde fila 8 hasta antes de la última)
  const dataStartRow = 8;
  const dataEndRow = data.length - 1;
  for (let row = dataStartRow; row <= dataEndRow; row++) {
    for (let col = 0; col < 13; col++) {
      const cellRef = utils.encode_cell({ r: row - 1, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          alignment: { 
            horizontal: col >= 8 && col <= 12 ? "right" : "left",
            vertical: "middle" 
          },
        };

        // Formato de número para columnas monetarias
        if (col >= 8 && col <= 12 && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = '0.00';
        }
      }
    }
  }

  // Fila de totales (última fila)
  const totalRowIndex = data.length;
  for (let col = 0; col < 13; col++) {
    const cellRef = utils.encode_cell({ r: totalRowIndex - 1, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFF00" } }, // Amarillo
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
        alignment: { 
          horizontal: col >= 8 && col <= 12 ? "right" : "left",
          vertical: "middle" 
        },
      };

      // Formato de número para columnas monetarias
      if ((col === 8 || col === 9 || col === 11 || col === 12) && typeof ws[cellRef].v === 'number') {
        ws[cellRef].z = '0.00';
      }
    }
  }

  // Ajustar ancho de columnas
  ws["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 6 },  // M.
    { wch: 8 },  // T.Doc
    { wch: 12 }, // F.vence
    { wch: 8 },  // Serie
    { wch: 10 }, // Numero
    { wch: 12 }, // Ruc
    { wch: 35 }, // Proveedor
    { wch: 12 }, // Percepcion
    { wch: 12 }, // Pv
    { wch: 12 }, // EstCompra
    { wch: 12 }, // Abono
    { wch: 12 }, // Saldo
  ];

  // Merge cells para encabezados
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Título principal
    { s: { r: 1, c: 10 }, e: { r: 1, c: 12 } }, // Fecha Desde
    { s: { r: 2, c: 10 }, e: { r: 2, c: 12 } }, // Hasta
    { s: { r: 3, c: 0 }, e: { r: 3, c: 12 } }, // Título del reporte
    { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }, // Forma de Pago
    { s: { r: 4, c: 6 }, e: { r: 4, c: 12 } }, // Estado de Compras
  ];

  // Crear libro de trabajo
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Compras");

  // Descargar archivo
  writeFile(wb, `${nameFile}.xlsx`);
}
