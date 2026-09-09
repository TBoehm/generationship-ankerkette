/**
 * Build-time configuration. A statically served bundle has no runtime
 * environment, so everything here is a constant that Vite resolves at build
 * time. Nothing secret belongs in this file, it ships to every visitor.
 */
export const APP_CONFIG = Object.freeze({
  basePath: import.meta.env.BASE_URL,
  isProduction: import.meta.env.PROD,
});
