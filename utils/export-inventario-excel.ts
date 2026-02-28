import { utils, writeFile } from "xlsx-js-style";
import dayjs from 'dayjs';

export interface EmpresaExcelInfo {
  razon_social?: string;
  ruc?: string;
  direccion?: string;
}

interface ExportStockValorizadoParams {
  items: Array<{
    cod_producto?: string;
    producto?: string;
    marca?: string | null;
    categoria?: string | null;
    unidad_medida?: string | null;
    stock?: number;
    costo_unitario?: number;
    valor_total?: number;
  }>;
  nameFile: string;
  totalValorizado?: number;
  empresa?: EmpresaExcelInfo;
  titulo?: string;
}

export function exportStockValorizadoToExcel({ items, nameFile, totalValorizado, empresa, titulo }: ExportStockValorizadoParams) {
  if (!items || items.length === 0) return;

  const data: any[][] = [];

  data.push([empresa?.razon_social || 'Mi Empresa']);
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', '', '', '', '', '', `Fecha: ${dayjs().format('DD/MM/YYYY HH:mm')}`]);
  data.push([empresa?.direccion || '']);
  data.push([titulo || 'STOCK VALORIZADO']);
  data.push([]);

  data.push(['Código', 'Producto', 'Marca', 'Categoría', 'U.Medida', 'Stock', 'Costo Unit.', 'Valor Total']);

  let sumValor = 0;

  items.forEach((item) => {
    const valor = Number(item.valor_total || 0);
    sumValor += valor;
    data.push([
      item.cod_producto || '',
      item.producto || '',
      item.marca || '',
      item.categoria || '',
      item.unidad_medida || '',
      Number(Number(item.stock || 0).toFixed(2)),
      Number(Number(item.costo_unitario || 0).toFixed(4)),
      Number(valor.toFixed(2)),
    ]);
  });

  data.push([
    '', '', '', '', 'TOTALES', '', '',
    Number((totalValorizado ?? sumValor).toFixed(2)),
  ]);

  const ws = utils.aoa_to_sheet(data);

  // Estilos título
  ws['A1'].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" } };
  ws['A3'].s = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center" } };

  // Headers (fila 5)
  for (let col = 0; col < 8; col++) {
    const cellRef = utils.encode_cell({ r: 4, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0D9488" } },
        alignment: { horizontal: "center" },
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
  for (let row = 5; row < data.length - 1; row++) {
    for (let col = 0; col < 8; col++) {
      const cellRef = utils.encode_cell({ r: row, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          alignment: { horizontal: col >= 5 ? "right" : "left" },
        };
        if (col >= 5 && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = col === 6 ? '#,##0.0000' : '#,##0.00';
        }
      }
    }
  }

  // Fila totales
  const lastRow = data.length - 1;
  for (let col = 0; col < 8; col++) {
    const cellRef = utils.encode_cell({ r: lastRow, c: col });
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
        alignment: { horizontal: col >= 5 ? "right" : "left" },
      };
      if (col === 7 && typeof ws[cellRef].v === 'number') {
        ws[cellRef].z = '#,##0.00';
      }
    }
  }

  ws["!cols"] = [
    { wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Stock Valorizado");
  writeFile(wb, `${nameFile}.xlsx`);
}

interface ExportCantidadesVendidasParams {
  items: Array<{
    cod_producto?: string;
    producto?: string;
    marca?: string | null;
    unidad_medida?: string | null;
    cantidad_vendida?: number;
    importe_venta?: number;
    num_ventas?: number;
  }>;
  nameFile: string;
  fechaDesde?: string;
  fechaHasta?: string;
  empresa?: EmpresaExcelInfo;
}

export function exportCantidadesVendidasToExcel({ items, nameFile, fechaDesde, fechaHasta, empresa }: ExportCantidadesVendidasParams) {
  if (!items || items.length === 0) return;

  const data: any[][] = [];

  data.push([empresa?.razon_social || 'Mi Empresa']);
  data.push([empresa?.ruc ? `RUC: ${empresa.ruc}` : '', '', '', '', `Desde: ${fechaDesde || '-'}`, '', `Hasta: ${fechaHasta || '-'}`]);
  data.push([empresa?.direccion || '']);
  data.push(['CANTIDADES VENDIDAS POR PRODUCTO']);
  data.push([]);

  data.push(['Código', 'Producto', 'Marca', 'U.Medida', 'Cant. Vendida', 'Importe Venta', 'N° Ventas']);

  let totalCantidad = 0;
  let totalImporte = 0;

  items.forEach((item) => {
    const cant = Number(item.cantidad_vendida || 0);
    const imp = Number(item.importe_venta || 0);
    totalCantidad += cant;
    totalImporte += imp;
    data.push([
      item.cod_producto || '',
      item.producto || '',
      item.marca || '',
      item.unidad_medida || '',
      Number(cant.toFixed(2)),
      Number(imp.toFixed(2)),
      Number(item.num_ventas || 0),
    ]);
  });

  data.push(['', '', '', 'TOTALES', Number(totalCantidad.toFixed(2)), Number(totalImporte.toFixed(2)), '']);

  const ws = utils.aoa_to_sheet(data);

  ws['A1'].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" } };
  ws['A3'].s = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center" } };

  for (let col = 0; col < 7; col++) {
    const cellRef = utils.encode_cell({ r: 4, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0D9488" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  for (let row = 5; row < data.length - 1; row++) {
    for (let col = 0; col < 7; col++) {
      const cellRef = utils.encode_cell({ r: row, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          alignment: { horizontal: col >= 4 ? "right" : "left" },
        };
        if (col >= 4 && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = '#,##0.00';
        }
      }
    }
  }

  const lastRow = data.length - 1;
  for (let col = 0; col < 7; col++) {
    const cellRef = utils.encode_cell({ r: lastRow, c: col });
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
        alignment: { horizontal: col >= 4 ? "right" : "left" },
      };
    }
  }

  ws["!cols"] = [
    { wch: 12 }, { wch: 35 }, { wch: 15 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 10 },
  ];

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Cantidades Vendidas");
  writeFile(wb, `${nameFile}.xlsx`);
}
