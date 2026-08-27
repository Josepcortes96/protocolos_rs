export const API_BASE = "/api";

export function getInformacionEndpoint() {
  const configuredEndpoint = import.meta.env.VITE_INFORMACION_ENDPOINT;

  if (!configuredEndpoint || configuredEndpoint === "/informacion") {
    return "/api/informacion";
  }

  if (
    window.location.protocol === "https:" &&
    configuredEndpoint.startsWith("http://")
  ) {
    return "/api/informacion";
  }

  return configuredEndpoint;
}

export function getAccesoId() {
  const match = window.location.pathname.match(/^\/acceso\/?([^/]+)?/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}
