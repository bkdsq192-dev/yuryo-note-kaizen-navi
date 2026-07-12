import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function normalizeBasePath(value?: string) {
  const fallback = "/";
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "/") {
    return fallback;
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

export default defineConfig(() => ({
  base: normalizeBasePath(process.env.APP_BASE_PATH),
  plugins: [react()],
}));
