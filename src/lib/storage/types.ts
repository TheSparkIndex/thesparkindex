export type PutOptions = {
  contentType: string;
};

export interface StorageService {
  put(key: string, data: Buffer, options: PutOptions): Promise<void>;
  get(key: string): Promise<{ body: Buffer; contentType: string | null } | null>;
  delete(key: string): Promise<void>;
  /** Public URL path used by the app to fetch this key. */
  urlFor(key: string): string;
}
