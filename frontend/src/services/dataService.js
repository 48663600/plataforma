// Punto único de acceso a los datos. Elige el modo según la configuración:
//  - "api":   hay VITE_API_URL → usa el backend Express + PostgreSQL (multiusuario).
//  - "local": sin VITE_API_URL → todo en el navegador (GitHub Pages / demostración).
import { API_URL, apiFetch } from "./api.js";
import * as local from "./localBackend.js";

export const MODE = API_URL ? "api" : "local";

const TOKEN_KEY = "academiq_token";
export const session = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  },
  set: (t) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* sesión solo en memoria */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nada que borrar */
    }
  },
};

export async function login(credentials) {
  if (MODE === "local") return local.login(credentials);
  return apiFetch("/api/auth/login", { method: "POST", body: credentials });
}

export async function loadState(token) {
  if (MODE === "local") return local.getState(token);
  return apiFetch("/api/state", { token });
}

export async function saveState(token, data) {
  if (MODE === "local") return local.putState(token, data);
  return apiFetch("/api/state", { token, method: "PUT", body: data });
}

export const resetDemo = local.resetDemo;
