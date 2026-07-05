import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_PAGES_REPOSITORY ?? "yuryo-note-kaizen-navi";
const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";

export default defineConfig(() => ({
  base: isGitHubPagesBuild ? `/${repositoryName}/` : "/",
  plugins: [react()],
}));