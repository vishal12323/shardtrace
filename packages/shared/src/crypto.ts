import crypto from "node:crypto";

export function sha256String(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

export function hashJson(value: unknown): string {
  return sha256String(stableStringify(value));
}

export function signPayload(payload: unknown, operatorPrivateKey: string): string {
  const msg = stableStringify(payload);
  return crypto.createHmac("sha256", operatorPrivateKey).update(msg).digest("hex");
}

export function verifySignature(
  payload: unknown,
  signature: string,
  operatorPrivateKey: string
): boolean {
  const expected = signPayload(payload, operatorPrivateKey);
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
