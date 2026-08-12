import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PutOptions, StorageService } from "./types";

const BASE = path.join(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_DIR ?? "storage/uploads");

function safePath(key: string): string {
  const normalized = path.normalize(key).replace(/^([./\\])+/, "");
  const full = path.join(/*turbopackIgnore: true*/ BASE, normalized);
  if (!full.startsWith(BASE)) {
    throw new Error("Invalid storage key");
  }
  return full;
}

export class LocalStorageService implements StorageService {
  private contentTypeCache = new Map<string, string | null>();

  async put(key: string, data: Buffer, options: PutOptions): Promise<void> {
    const file = safePath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
    this.contentTypeCache.set(file, options.contentType);
  }

  async get(key: string) {
    try {
      const file = safePath(key);
      const body = await readFile(file);
      return { body, contentType: this.contentTypeCache.get(file) ?? null };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(safePath(key));
    } catch {
      // ignore missing files
    }
  }

  urlFor(key: string): string {
    return `/media/${key}`;
  }
}
