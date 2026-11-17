import * as React from 'react';

import { AccountDatos } from '@/components/dashboard/account/account-datos';
import { AccountHero } from '@/components/dashboard/account/account-hero';
import { AccountTalleres } from '@/components/dashboard/account/account-talleres';

export default function Page(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AccountHero />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <AccountDatos />
        <div className="min-w-0 lg:col-span-2">
          <AccountTalleres />
        </div>
      </div>
    </div>
  );
}
