import crypto from "node:crypto";

function encryptionKey() {
  const raw = process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY;
  if (!raw)
    throw new Error("Google Calendar token encryption is not configured.");
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return ["v1", iv, tag, encrypted]
    .map((part) => (Buffer.isBuffer(part) ? part.toString("base64url") : part))
    .join(":");
}

export function decryptSecret(value) {
  if (!value) return null;
  const [version, ivValue, tagValue, encryptedValue] = String(value).split(":");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Stored integration credentials are invalid.");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function stateSecret() {
  const value =
    process.env.GOOGLE_CALENDAR_STATE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("OAuth state signing is not configured.");
  return value;
}

export function signState(payload, ttlSeconds = 600) {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", stateSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifyState(value) {
  const [body, provided] = String(value || "").split(".");
  if (!body || !provided) throw new Error("OAuth state is missing or invalid.");
  const expected = crypto
    .createHmac("sha256", stateSecret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("OAuth state verification failed.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("OAuth state has expired.");
  }
  return payload;
}
