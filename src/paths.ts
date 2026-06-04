export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    mapa: '/mapa',
    // bajas: '/reportes/bajas',
    account: '/account',
    integrations: '/integrations',
    padron: '/padron',
    ficha_tecnica: '/fichas-tecnicas',
    settings: '/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
