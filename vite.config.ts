import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// Version affichée dans l'app :
//  - __APP_VERSION__ : semver du package.json (bump pour les vraies releases)
//  - __APP_BUILD__   : numéro de build injecté par la CI (github.run_number) → s'incrémente
//                      automatiquement à chaque push ; "dev" en local.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));
const appBuild = process.env.VITE_APP_BUILD || "dev";

export default defineConfig({
  plugins: [react(), svgr(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(appBuild),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/database", "firebase/auth"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
