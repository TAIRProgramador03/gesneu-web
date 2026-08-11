'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerLosTalleresDelUsuario, obtenerNeumaticosEnCritico } from '@/api/Neumaticos';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { useUser } from '@/hooks/use-user';
import { columnsNeuCriticos } from '@/app/(app)/dashboard/columns-mas-desgastados';
import { BadgeCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const TablaCriticos = (): React.JSX.Element => {
  const { user } = useUser();
  const [taller, setTaller] = React.useState<string>('todos');

  const { data: talleres = [] } = useQuery({
    queryKey: ['talleres-del-usuario'],
    queryFn: obtenerLosTalleresDelUsuario,
  });

  React.useEffect(() => {
    if (talleres.length === 1) setTaller(talleres[0].value);
  }, [talleres]);

  const { data: neumaticosEnCritico = [], isLoading } = useQuery({
    queryKey: ['neumaticos-en-critico', { taller }],
    queryFn: () => obtenerNeumaticosEnCritico(taller)
  })

  return (
    <div style={{ padding: '16px 20px 20px' }}>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Select value={taller} onValueChange={setTaller}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Taller" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {talleres.length > 1 && (
              <SelectItem value="todos">Todos los talleres</SelectItem>
            )}
            {talleres.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {
        neumaticosEnCritico.length === 0 && !isLoading && (
          <div className='flex gap-1 flex-wrap justify-center items-center bg-red-50 text-red-700 border-2 border-red-700 p-2 rounded-lg'>
            <BadgeCheck width={12} />
            <span className='italic text-xs'>No cuentas con neumáticos en estado crítico que se encuentren asignados.</span>
          </div>
        )
      }

      {
        neumaticosEnCritico.length >= 1 && (
          <DataTableNeumaticos
            columns={columnsNeuCriticos}
            data={neumaticosEnCritico}
            filters={true}
            withExport={true}
            isLoading={isLoading}
            exportConfig={{
              title: 'GESNEU: TOP 10 NEUMÁTICOS MÁS DESGASTADOS',
              fileName: 'GESNEU_NEUMATICOS-MAS-DESGASTADOS',
              username: user?.usuario
            }}
          />
        )
      }


    </div>
  );
}
