// next.config.ts - Next.js configuration file for project settings
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'ijtwvrzkbnfepbfyfrvc.supabase.co', // Supabase storage domain
      'supabase.co', // General Supabase domain (for future use)
      'youtube.com', // YouTube domain (for future use)
      'i.ytimg.com', // YouTube image domain (for future use)
      'yt3.ggpht.com', // YouTube profile images
    ],
  },
};

export default nextConfig;
