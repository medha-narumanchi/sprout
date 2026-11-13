import type { NextConfig } from "next";

// No `output: 'export'` any more: the app now has server-side API routes
// (app/api/chat, app/api/tts), so it needs a server — deployed on Vercel.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
