/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aqarati/shared'],
  i18n: undefined, // We handle i18n manually via [lang] route
};

module.exports = nextConfig;
