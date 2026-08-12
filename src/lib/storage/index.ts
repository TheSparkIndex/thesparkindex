import { LocalStorageService } from "./local";
import type { StorageService } from "./types";

function createStorage(): StorageService {
  switch (process.env.STORAGE_DRIVER ?? "local") {
    case "local":
      return new LocalStorageService();
    // Add S3/R2/Supabase drivers here. The rest of the app never knows the difference.
    default:
      return new LocalStorageService();
  }
}

export const storage = createStorage();
