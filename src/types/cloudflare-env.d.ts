/// <reference types="@opennextjs/cloudflare" />

declare global {
  interface CloudflareEnv {
    // DB is already declared by OpenNext
    R2_BUCKET: {
      put: (key: string, value: ArrayBuffer | Buffer, options?: any) => Promise<any>;
    };
  }
}

export {};