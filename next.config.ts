import type {NextConfig} from 'next';

const config: NextConfig = {
  output: 'export',
  images: {unoptimized: true},
  basePath: '/soriva',
};

export default config;
