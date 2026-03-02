/// <reference types="@opennextjs/cloudflare" />

import type { D1Database } from "@opennextjs/cloudflare";

declare global {
  interface CloudflareEnv {
    R2_BUCKET: {
      put: (key: string, value: ArrayBuffer | Buffer, options?: any) => Promise<any>;
    };
    // DB is already declared in OpenNext, no need to redeclare
  }
}

export {};