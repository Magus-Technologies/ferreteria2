import { utils, writeFile } from "xlsx-js-style";
import dayjs from 'dayjs';

export interface EmpresaExcelInfo {
  razon_social?: string;
  ruc?: string;
  direccion?: string;
}

// ============= LISTADO DE CLIENTES =============

interface ExportListadoClientesParams {
  items: Array<{
    numero_documento?: string;
    nombre?: string;
    tipo_cliente?: string;
    direccion?: string | null;
    telefono?: string | null;
    email?: string | null;
    estado?: boolean;
    total_ventas?: number;
    total_compras?: number;
  }>;
  nameFile: string;
  empresa?: EmpresaExcelInfo;
  titulo?: string;
}

export function exportListadoClientesToExcel({ items, nameFile, empresa, titulo }: ExportListadoClientesParams) {
  if (!items || items.length === 0) return;

  const data: any[][] = [];
  const numCols = 8;

  data.push([empresa?.razon_social || 'Mi Empresa']);
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', '', '', '', '', '', `Fecha: ${dayjs().format('DD/MM/YYYY HH:mm')}`]);
  data.push([empresa?.direccion || '']);
  data.push([titulo || 'LISTADO DE CLIENTES']);
  data.push([]);

  data.push(['Documento', 'Cliente', 'Tipo', 'Dirección', 'Teléfono', 'Email', 'N° Ventas', 'Total Compras']);

  let totalCompras = 0;

  items.forEach((item) => {
    const tc = Number(item.total_compras || 0);
    totalCompras += tc;
    data.push([
      item.numero_documento || '',
      item.nombre || '',
      item.tipo_cliente === 'e' ? 'Empresa' : 'Persona',
      item.direccion || '',
      item.telefono || '',
      item.email || '',
      Number(item.total_ventas || 0),
      Number(tc.toFixed(2)),
    ]);
  });

  data.push(['', '', '', '', '', 'TOTALES', '', Number(totalCompras.toFixed(2))]);

  const ws = utils.aoa_to_sheet(data);
  applyStyles(ws, numCols, data.length, [6, 7]);

  ws["!cols"] = [
    { wch: 13 }, { wch: 30 }, { wch: 10 }, { wch: 25 },
    { wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 14 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Clientes");
  writeFile(wb, `${nameFile}.xlsx`);
}

// ============= CUENTAS POR COBRAR =============

interface ExportPorCobrarParams {
  items: Array<{
    numero_documento?: string;
    nombre?: string;
    telefono?: string | null;
    num_ventas_credito?: number;
    total_credito?: number;
    total_pagado?: number;
    saldo_pendiente?: number;
  }>;
  nameFile: string;
  empresa?: EmpresaExcelInfo;
  resumen?: { total_credito: number; total_pagado: number; total_por_cobrar: number };
}

export function exportPorCobrarToExcel({ items, nameFile, empresa, resumen }: ExportPorCobrarParams) {
  if (!items || items.length === 0) return;

  const data: any[][] = [];
  const numCols = 7;

  data.push([empresa?.razon_social || 'Mi Empresa']);
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', '', '', '', '', `Fecha: ${dayjs().format('DD/MM/YYYY HH:mm')}`]);
  data.push([empresa?.direccion || '']);
  data.push(['CUENTAS POR COBRAR - CLIENTES']);
  data.push([]);

  data.push(['Documento', 'Cliente', 'Teléfono', 'N° Ventas Cred.', 'Total Crédito', 'Total Pagado', 'Saldo Pendiente']);

  items.forEach((item) => {
    data.push([
      item.numero_documento || '',
      item.nombre || '',
      item.telefono || '',
      Number(item.num_ventas_credito || 0),
      Number(Number(item.total_credito || 0).toFixed(2)),
      Number(Number(item.total_pagado || 0).toFixed(2)),
      Number(Number(item.saldo_pendiente || 0).toFixed(2)),
    ]);
  });

  data.push([
    '', '', 'TOTALES', '',
    Number((resumen?.total_credito ?? 0).toFixed(2)),
    Number((resumen?.total_pagado ?? 0).toFixed(2)),
    Number((resumen?.total_por_cobrar ?? 0).toFixed(2)),
  ]);

  const ws = utils.aoa_to_sheet(data);
  applyStyles(ws, numCols, data.length, [3, 4, 5, 6]);

  ws["!cols"] = [
    { wch: 13 }, { wch: 30 }, { wch: 14 }, { wch: 16 },
    { wch: 14 }, { wch: 14 }, { wch: 16 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Cuentas por Cobrar");
  writeFile(wb, `${nameFile}.xlsx`);
}

// ============= CLIENTES FRECUENTES =============

interface ExportFrecuentesParams {
  items: Array<{
    numero_documento?: string;
    nombre?: string;
    tipo_cliente?: string;
    num_ventas?: number;
    total_compras?: number;
  }>;
  nameFile: string;
  empresa?: EmpresaExcelInfo;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function exportFrecuentesToExcel({ items, nameFile, empresa, fechaDesde, fechaHasta }: ExportFrecuentesParams) {
  if (!items || items.length === 0) return;

  const data: any[][] = [];
  const numCols = 5;

  data.push([empresa?.razon_social || 'Mi Empresa']);
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', `Desde: ${fechaDesde || '-'}`, '', `Hasta: ${fechaHasta || '-'}`]);
  data.push([empresa?.direccion || '']);
  data.push(['CLIENTES FRECUENTES']);
  data.push([]);

  data.push(['Documento', 'Cliente', 'Tipo', 'N° Ventas', 'Total Compras']);

  items.forEach((item) => {
    data.push([
      item.numero_documento || '',
      item.nombre || '',
      item.tipo_cliente === 'e' ? 'Empresa' : 'Persona',
      Number(item.num_ventas || 0),
      Number(Number(item.total_compras || 0).toFixed(2)),
    ]);
  });

  const ws = utils.aoa_to_sheet(data);
  applyStyles(ws, numCols, data.length, [3, 4]);

  ws["!cols"] = [
    { wch: 13 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Frecuentes");
  writeFile(wb, `${nameFile}.xlsx`);
}

// ============= ESTILOS COMUNES =============

function applyStyles(ws: any, numCols: number, totalRows: number, numericCols: number[]) {
  // Título
  if (ws['A1']) ws['A1'].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" } };
  if (ws['A3']) ws['A3'].s = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center" } };

  const headerRow = 5;
  const border = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  // Headers
  for (let col = 0; col < numCols; col++) {
    const cellRef = utils.encode_cell({ r: headerRow - 1, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } },
        alignment: { horizontal: "center" },
        border,
      };
    }
  }

  // Data rows
  for (let row = headerRow; row < totalRows - 1; row++) {
    for (let col = 0; col < numCols; col++) {
      const cellRef = utils.encode_cell({ r: row, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          border,
          alignment: { horizontal: numericCols.includes(col) ? "right" : "left" },
        };
        if (numericCols.includes(col) && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = '#,##0.00';
        }
      }
    }
  }

  // Totals row
  const lastRow = totalRows - 1;
  for (let col = 0; col < numCols; col++) {
    const cellRef = utils.encode_cell({ r: lastRow, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFF00" } },
        border,
        alignment: { horizontal: numericCols.includes(col) ? "right" : "left" },
      };
      if (numericCols.includes(col) && typeof ws[cellRef].v === 'number') {
        ws[cellRef].z = '#,##0.00';
      }
    }
  }
}
