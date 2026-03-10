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
  
  // Configuración para solucionar el error de ActionQueueContext
  reactStrictMode: false,
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