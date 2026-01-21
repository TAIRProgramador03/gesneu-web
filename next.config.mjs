/** @type {import('next').NextConfig} */
const config = {
  // Permitir solicitudes de desarrollo desde orígenes específicos
  allowedDevOrigins: [
    '192.168.100.63',
    '192.168.100.182',
    'localhost',
    '127.0.0.1',
    // Agrega más IPs si es necesario
  ],
  
  // Configuración para solucionar el error de ActionQueueContext
  reactStrictMode: false,
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default config;