import { ListPadronMapped } from '@/types/padron';
import XLSXStyle from 'xlsx-js-style';

interface ExportExcelParams {
  data: ListPadronMapped
  username: string,
  title?: string,
  fileName?: string
}

const thinBorder = {
  top: { style: 'thin', color: { rgb: 'BBBBBB' } },
  bottom: { style: 'thin', color: { rgb: 'BBBBBB' } },
  left: { style: 'thin', color: { rgb: 'BBBBBB' } },
  right: { style: 'thin', color: { rgb: 'BBBBBB' } },
};

export const exportToExcel = ({ data, username, title = 'Default title', fileName = 'GESNEU_PADRON-NEUMATICOS' }: ExportExcelParams) => {
  const wb = XLSXStyle.utils.book_new();
  const ws: XLSXStyle.WorkSheet = {};

  const headers = Object.keys(data[0] ?? {});
  const numCols = headers.length;

  ws['A1'] = {
    v: title,
    t: 's',
    s: {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 22 },
      fill: { fgColor: { rgb: '002141' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    },
  };

  headers.forEach((header, colIdx) => {
    const cellRef = XLSXStyle.utils.encode_cell({ r: 1, c: colIdx });
    ws[cellRef] = {
      v: header,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A3276' } },
        alignment: { horizontal: 'center' },
        border: thinBorder,
      },
    };
  });

  data.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    const rowFill = isEven ? { fgColor: { rgb: 'F5F8FF' } } : { fgColor: { rgb: 'FFFFFF' } };
    headers.forEach((header, colIdx) => {
      const cellRef = XLSXStyle.utils.encode_cell({ r: rowIdx + 2, c: colIdx });
      const value = (row as unknown as Record<string, unknown>)[header];
      ws[cellRef] = {
        v: value ?? '',
        t: typeof value === 'number' ? 'n' : 's',
        s: { border: thinBorder, fill: rowFill },
      };
    });
  });

  ws['!ref'] = XLSXStyle.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: data.length + 1, c: numCols - 1 },
  });

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];
  ws['!rows'] = [{ hpt: 65 }];

  const colWidths = headers.map((header) => {
    if (header === 'Proveedor') return { wch: 30 };
    if (header === 'Porcentaje de Vida (%)') return { wch: 25 };
    return { wch: 14 };
  });

  ws['!cols'] = colWidths;
  ws['!autofilter'] = { ref: XLSXStyle.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }) };

  ws['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3', state: 'frozen' };

  XLSXStyle.utils.book_append_sheet(wb, ws, 'Padrón');
  XLSXStyle.writeFile(wb, `${fileName}_${username.trim()}.xlsx`);
};
