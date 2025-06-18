/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure webpack to ignore certain warnings
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.ignoreWarnings = [
        /Extra attributes from the server/,
        /data-new-gr-c-s-check-loaded/,
        /data-gr-ext-installed/,
      ];
    }
    return config;
  },
};

export default nextConfig;
