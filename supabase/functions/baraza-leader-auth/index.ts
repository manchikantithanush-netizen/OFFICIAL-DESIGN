import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
  "cache-control": "no-store",
  "content-type": "application/json",
};
const sessionLifetimeSeconds = 8 * 60 * 60;
const encoder = new TextEncoder();
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const sessionSecret = Deno.env.get("BARAZA_SESSION_SECRET");
const invalidCredentialsMessage = "Invalid name or access code. Please try again.";

if (!supabaseUrl || !serviceRoleKey || !sessionSecret || sessionSecret.length < 32) {
  throw new Error("Baraza authentication requires Supabase service credentials and a 32-character session secret.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const signingKey = await crypto.subtle.importKey(
  "raw",
  encoder.encode(sessionSecret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const encodeBase64Url = (value: Uint8Array) =>
  btoa(String.fromCharCode(...value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const decodeBase64Url = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createSessionToken = async (barazaId: number) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({
    iss: "roundsquare-baraza-leader",
    sub: String(barazaId),
    barazaId,
    iat: issuedAt,
    exp: issuedAt + sessionLifetimeSeconds,
  })));
  const unsignedToken = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(unsignedToken));
  return `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;
};

const readSession = async (token: unknown) => {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  let header: unknown;
  let payload: unknown;
  let signature: Uint8Array;
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    signature = decodeBase64Url(parts[2]);
  } catch {
    return null;
  }

  if (!isRecord(header) || !isRecord(payload)) return null;
  const barazaId = payload.barazaId;
  const expiresAt = payload.exp;
  if (header.alg !== "HS256" || header.typ !== "JWT"
    || payload.iss !== "roundsquare-baraza-leader"
    || typeof barazaId !== "number" || !Number.isInteger(barazaId) || barazaId < 1 || barazaId > 17
    || payload.sub !== String(barazaId)
    || typeof expiresAt !== "number" || !Number.isInteger(expiresAt)
    || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const validSignature = await crypto.subtle.verify(
    "HMAC",
    signingKey,
    signature,
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  return validSignature ? barazaId : null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2048) return jsonResponse({ error: "Request is too large." }, 413);

  let body: { action?: unknown; fullName?: unknown; accessCode?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  if (body.action === "login") {
    const fullName = typeof body.fullName === "string" ? body.fullName.normalize("NFKC").trim() : "";
    const accessCode = typeof body.accessCode === "string" ? body.accessCode : "";
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("cf-connecting-ip")?.trim()
      || request.headers.get("x-real-ip")?.trim();

    if (!clientIp) {
      console.error("Baraza login request did not include a client IP for rate limiting.");
      return jsonResponse({ error: "Baraza sign-in is temporarily unavailable. Please try again." }, 503);
    }
    if (fullName.length > 80 || accessCode.length > 5) {
      return jsonResponse({ error: invalidCredentialsMessage }, 401);
    }

    const { data: barazaId, error } = await admin.rpc("authenticate_baraza_leader", {
      p_full_name: fullName,
      p_access_code: accessCode,
      p_client_ip: clientIp,
    });
    if (error) {
      console.error("Baraza login verification failed.", error.message);
      return jsonResponse({ error: "Baraza sign-in is temporarily unavailable. Please try again." }, 503);
    }
    if (!Number.isInteger(barazaId) || barazaId < 1 || barazaId > 17) {
      return jsonResponse({ error: invalidCredentialsMessage }, 401);
    }

    return jsonResponse({
      token: await createSessionToken(barazaId),
      barazaId,
    });
  }

  if (body.action === "session") {
    const barazaId = await readSession(body.token);
    if (!barazaId) return jsonResponse({ error: "Session expired. Sign in again." }, 401);

    const { data, error } = await admin
      .from("baraza_leader_accounts")
      .select("baraza_id")
      .eq("baraza_id", barazaId)
      .eq("enabled", true)
      .maybeSingle();
    if (error) {
      console.error("Baraza session verification failed.", error.message);
      return jsonResponse({ error: "Baraza dashboard is temporarily unavailable. Please try again." }, 503);
    }
    if (!data) return jsonResponse({ error: "Session expired. Sign in again." }, 401);

    return jsonResponse({ barazaId: data.baraza_id });
  }

  return jsonResponse({ error: "Invalid request." }, 400);
});
