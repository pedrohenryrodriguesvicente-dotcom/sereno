import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita el aviso de múltiples lockfiles: fija la raíz en este proyecto.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
