'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerNeumaticosEnCritico } from '@/api/Neumaticos';
import { DataTableNeumaticos } from '@/components/ui/data-table/data-table';
import { useUser } from '@/hooks/use-user';
import { columnsNeuCriticos } from '@/app/dashboard/columns-mas-desgastados';
import { BadgeCheck } from 'lucide-react';

export const TablaCriticos = (): React.JSX.Element => {
  const { user } = useUser();

  const { data: neumaticosEnCritico = [], isLoading } = useQuery({
    queryKey: ['neumaticos-en-critico'],
    queryFn: obtenerNeumaticosEnCritico
  })

  return (
    <div style={{ padding: '16px 20px 20px' }}>

      {
        neumaticosEnCritico.length === 0 && (
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
