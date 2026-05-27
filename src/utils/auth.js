import { VALIDAR_USUARIO_QUERY } from "../graphql/queries/auth";

const STORAGE_KEY = "comandas_admin_auth";
const DEFAULT_HTTP_URL = "http://localhost:4100/graphql";
const VALIDATE_TOKEN_QUERY = `
  query ValidateToken($accessToken: String) {
    validateToken(accessToken: $accessToken) {
      status
      content
      claims
    }
  }
`;

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredAccessToken() {
  return getStoredAuth()?.accessToken || "";
}

export function saveAuthContext(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export async function authenticateFromBackend() {
  const httpUri = import.meta.env.VITE_GRAPHQL_HTTP_URL || DEFAULT_HTTP_URL;
  const v3Login = import.meta.env.VITE_V3_LOGIN || "";
  const v3Pswd = import.meta.env.VITE_V3_PSWD || "";

  if (!v3Login || !v3Pswd) {
    throw new Error("Faltan VITE_V3_LOGIN o VITE_V3_PSWD en variables de entorno.");
  }

  const response = await fetch(httpUri, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: VALIDAR_USUARIO_QUERY,
      variables: { v3Login, v3Pswd },
    }),
  });

  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    const backendMsg = body.errors?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`Error validando usuario: ${backendMsg}`);
  }

  const accessToken = body?.data?.validarUsuario?.accessToken;
  if (!accessToken) throw new Error("No se recibió accessToken en validarUsuario.");

  const validateTokenResponse = await fetch(httpUri, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: VALIDATE_TOKEN_QUERY,
      variables: { accessToken },
    }),
  });
  const validateBody = await validateTokenResponse.json();
  if (!validateTokenResponse.ok || validateBody.errors?.length) {
    const backendMsg = validateBody.errors?.[0]?.message || `HTTP ${validateTokenResponse.status}`;
    throw new Error(`Error validando token: ${backendMsg}`);
  }
  if (validateBody?.data?.validateToken?.status !== "success") {
    throw new Error(validateBody?.data?.validateToken?.content || "No se pudo obtener empresa/sucursal desde token.");
  }
  const claims = validateBody?.data?.validateToken?.claims || {};

  const authContext = {
    accessToken,
    empresa: claims?.usr_empresa || claims?.empresa || claims?.codigo_empresa || null,
    sucursal: claims?.sucursal || claims?.usr_sucursal || claims?.codigo_sucursal || null,
  };

  saveAuthContext(authContext);
  return authContext;
}
