import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BlobServiceClient } from "@azure/storage-blob";

/** Stores rendered report artifacts. Filesystem locally, Azure Blob in cloud. */
export interface BlobUploader {
  upload(key: string, content: string, contentType: string): Promise<string>;
}

export class FilesystemBlobUploader implements BlobUploader {
  constructor(private readonly dir: string) {}
  async upload(key: string, content: string): Promise<string> {
    const path = resolve(this.dir, key);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, "utf8");
    return `file://${path}`;
  }
}

export class AzureBlobUploader implements BlobUploader {
  private readonly containerName: string;
  private readonly service: BlobServiceClient;
  constructor(connectionString: string, containerName: string) {
    this.service = BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
  }
  async upload(key: string, content: string, contentType: string): Promise<string> {
    const container = this.service.getContainerClient(this.containerName);
    await container.createIfNotExists();
    const blob = container.getBlockBlobClient(key);
    await blob.upload(content, Buffer.byteLength(content), { blobHTTPHeaders: { blobContentType: contentType } });
    return blob.url;
  }
}

/** Azure Blob when AZURE_STORAGE_CONNECTION_STRING is set, else filesystem. */
export function createBlobUploader(): BlobUploader {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (conn) return new AzureBlobUploader(conn, process.env.AZURE_STORAGE_CONTAINER ?? "reports");
  return new FilesystemBlobUploader(process.env.ARTIFACTS_DIR ?? resolve(process.cwd(), ".artifacts"));
}
