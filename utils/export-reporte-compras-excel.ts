import { utils, writeFile } from "xlsx-js-style";
import { type CompraReporteItem } from "~/lib/api/compra";
import dayjs from 'dayjs';

export interface EmpresaExcelInfo {
  razon_social?: string;
  ruc?: string;
  direccion?: string;
}

interface ExportReporteComprasExcelParams {
  items: CompraReporteItem[];
  nameFile: string;
  fechaDesde?: string;
  fechaHasta?: string;
  empresa?: EmpresaExcelInfo;
}

export function exportReporteComprasToExcel({ items, nameFile, fechaDesde, fechaHasta, empresa }: ExportReporteComprasExcelParams) {
  if (!items || items.length === 0) {
    return;
  }

  const data: any[][] = [];

  // ENCABEZADO
  data.push([empresa?.razon_social || 'Mi Empresa']);
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', '', '', '', '', '', '', `Fecha Desde: ${fechaDesde || dayjs().format('DD/MM/YYYY')}`]);
  data.push([empresa?.direccion || '', '', '', '', '', '', '', '', `Hasta: ${fechaHasta || dayjs().format('DD/MM/YYYY')}`]);
  data.push(['REPORTE DE COMPRAS']);
  data.push([]);

  // ENCABEZADOS DE COLUMNAS
  data.push(['Fecha', 'T.Doc', 'Serie', 'Número', 'RUC', 'Proveedor', 'Total', 'F.Pago', 'Estado', 'Pagado', 'Saldo']);

  // DATOS
  let totalMonto = 0;
  let totalPagado = 0;
  let totalSaldo = 0;

  items.forEach((item) => {
    const total = Number(item.total || 0);
    const pagado = Number(item.total_pagado || 0);
    const saldo = Number(item.saldo || 0);

    totalMonto += total;
    totalPagado += pagado;
    totalSaldo += saldo;

    const formaPago = item.forma_de_pago === 'co' ? 'Contado' : item.forma_de_pago === 'cr' ? 'Crédito' : item.forma_de_pago;
    const estado = item.estado_de_compra === 'an' ? 'Anulada' : item.estado_de_compra === 'pe' ? 'Pendiente' : 'Activa';

    data.push([
      dayjs(item.fecha).format('DD/MM/YYYY'),
      item.tipo_documento || '',
      item.serie || '',
      item.numero || '',
      item.proveedor_ruc || '',
      item.proveedor_nombre || '',
      Number(total.toFixed(2)),
      formaPago,
      estado,
      Number(pagado.toFixed(2)),
      Number(saldo.toFixed(2)),
    ]);
  });

  // FILA TOTALES
  data.push([
    '', '', '', '', '', 'TOTALES',
    Number(totalMonto.toFixed(2)),
    '', '',
    Number(totalPagado.toFixed(2)),
    Number(totalSaldo.toFixed(2)),
  ]);

  const ws = utils.aoa_to_sheet(data);

  // ESTILOS - Título
  ws['A1'].s = {
    font: { bold: true, sz: 12 },
    alignment: { horizontal: "center", vertical: "center" },
  };

  ws['A4'].s = {
    font: { bold: true, sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
  };

  // Encabezados columnas (fila 6)
  const headerRow = 6;
  for (let col = 0; col < 11; col++) {
    const cellRef = utils.encode_cell({ r: headerRow - 1, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
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

  // Datos
  const dataStartRow = 7;
  const dataEndRow = data.length - 1;
  for (let row = dataStartRow; row <= dataEndRow; row++) {
    for (let col = 0; col < 11; col++) {
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
            horizontal: col >= 6 && col <= 10 ? "right" : "left",
            vertical: "middle"
          },
        };

        if (col >= 6 && col <= 10 && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = '#,##0.00';
        }
      }
    }
  }

  // Fila totales (última)
  const totalRowIndex = data.length;
  for (let col = 0; col < 11; col++) {
    const cellRef = utils.encode_cell({ r: totalRowIndex - 1, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFF00" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
        alignment: {
          horizontal: col >= 6 && col <= 10 ? "right" : "left",
          vertical: "middle"
        },
      };

      if ((col === 6 || col === 9 || col === 10) && typeof ws[cellRef].v === 'number') {
        ws[cellRef].z = '#,##0.00';
      }
    }
  }

  // Anchos de columnas
  ws["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 8 },  // T.Doc
    { wch: 8 },  // Serie
    { wch: 10 }, // Número
    { wch: 12 }, // RUC
    { wch: 35 }, // Proveedor
    { wch: 14 }, // Total
    { wch: 10 }, // F.Pago
    { wch: 10 }, // Estado
    { wch: 14 }, // Pagado
    { wch: 14 }, // Saldo
  ];

  // Merges
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 8 }, e: { r: 1, c: 10 } },
    { s: { r: 2, c: 8 }, e: { r: 2, c: 10 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Reporte Compras");
  writeFile(wb, `${nameFile}.xlsx`);
}
