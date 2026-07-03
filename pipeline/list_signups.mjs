// Exporta las altas capturadas en Vercel Blob a CSV por stdout.
// Uso: BLOB_READ_WRITE_TOKEN=vercel_blob_… node pipeline/list_signups.mjs > signups.csv
import { list } from '@vercel/blob';

const rows = ['ts,list,email'];
let cursor;
do {
  const page = await list({ prefix: 'signups/', cursor, limit: 1000 });
  for (const b of page.blobs) {
    const data = await (await fetch(b.url)).json();
    rows.push(`${data.ts},${data.list},${data.email}`);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
console.log(rows.join('\n'));
