import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

/**
 * SecureStore has a ~2048-byte value limit on iOS.
 * Supabase sessions (access + refresh tokens + user metadata) often exceed that,
 * so we chunk large values across multiple SecureStore entries.
 */
const CHUNK_SIZE = 1800;

async function getItem(key: string): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.chunks === "number") {
      const parts: string[] = [];
      for (let i = 0; i < parsed.chunks; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`);
        if (chunk === null) return null;
        parts.push(chunk);
      }
      return parts.join("");
    }
  } catch {
    // Not JSON — return raw value as-is
  }

  return raw;
}

async function setItem(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const numChunks = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(key, JSON.stringify({ chunks: numChunks }));

  for (let i = 0; i < numChunks; i++) {
    await SecureStore.setItemAsync(
      `${key}__chunk_${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    );
  }
}

async function removeItem(key: string): Promise<void> {
  const raw = await SecureStore.getItemAsync(key);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.chunks === "number") {
        for (let i = 0; i < parsed.chunks; i++) {
          await SecureStore.deleteItemAsync(`${key}__chunk_${i}`);
        }
      }
    } catch {
      // Not chunked — just delete the main key
    }
  }
  await SecureStore.deleteItemAsync(key);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: { getItem, setItem, removeItem },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
