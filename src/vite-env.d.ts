/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/** Version semver (package.json), injectée au build par Vite. */
declare const __APP_VERSION__: string;
/** Numéro de build CI (github.run_number) ou "dev" en local. */
declare const __APP_BUILD__: string;
