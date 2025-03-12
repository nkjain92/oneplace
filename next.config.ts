// next.config.ts - Next.js configuration file for project settings
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ijtwvrzkbnfepbfyfrvc.supabase.co',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'youtube.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
