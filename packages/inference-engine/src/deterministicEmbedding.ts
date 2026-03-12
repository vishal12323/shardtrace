import crypto from "node:crypto";
import { DEFAULT_VECTOR_SIZE } from "@shardtrace/shared";

function round6(x: number): number {
  return Math.round(x * 1e6) / 1e6;
}

function tokenHashBytes(token: string): Buffer {
  return crypto.createHash("sha256").update(token).digest();
}

export function deterministicEmbedding(
  document: string,
  vectorSize = DEFAULT_VECTOR_SIZE
): number[] {
  if (vectorSize <= 0) throw new Error("vectorSize must be > 0");
  const tokens = document.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const vec = new Array<number>(vectorSize).fill(0);

  for (const t of tokens) {
    const bytes = tokenHashBytes(t);
    for (let i = 0; i < bytes.length; i++) {
      const idx = i % vectorSize;
      vec[idx] += bytes[i]! / 255;
    }
  }

  const denom = Math.max(1, tokens.length);
  for (let i = 0; i < vec.length; i++) vec[i] = round6(vec[i]! / denom);
  return vec;
}

export function embedDocuments(
  documents: string[],
  vectorSize = DEFAULT_VECTOR_SIZE
): number[][] {
  return documents.map((d) => deterministicEmbedding(d, vectorSize));
}

