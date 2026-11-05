/** @type {import('next').NextConfig} */
const config = {
  // Permitir solicitudes de desarrollo desde orígenes específicos
  allowedDevOrigins: [
    '192.168.100.63',
    '192.168.100.182',
    '192.168.4.51',
    'localhost',
    '127.0.0.1',
  ],
  
  // Permite levantar un segundo servidor de desarrollo para verificar un cambio sin
  // pisar el .next del que ya está corriendo (NEXT_TEST_DIST_DIR=.next-xxx next dev -p 3097).
  // Sin esto, los dos escriben en la misma carpeta y el servidor en uso se cae.
  distDir: process.env.NEXT_TEST_DIST_DIR || '.next',

  // Configuración para solucionar el error de ActionQueueContext
  reactStrictMode: true,
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (webpackConfig, { isServer }) => {
    if (!isServer) {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
      };
    }
    return webpackConfig;
  },
};

export default config;