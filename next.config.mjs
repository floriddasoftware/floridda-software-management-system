import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "firebase/app": false,
      "firebase/firestore": false,
      "firebase/auth": false,
      "firebase/storage": false,
    };
    return config;
  },
};

export default nextConfig;