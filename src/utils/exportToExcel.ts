import { ListPadronMapped } from '@/types/padron';
import * as XLSX from 'xlsx';

interface Props {
  data: ListPadronMapped
}

export const exportToExcel = ({ data }: Props) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Padrón');
  XLSX.writeFile(wb, `padron_neumaticos_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
