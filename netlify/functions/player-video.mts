import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// GET /player-videos/:id  public delivery of an Essential-tier player's
// single uploaded highlight clip, with byte-range support so it can stream
// and seek. Mirrors /madi-media/:id, but reads the separate stores
// player-video-upload.js writes to instead of the Visual-Dashboard's asset catalog, since
// Essential players aren't in the Visual-Dashboard at all.
const SITE_ID = process.env.BLOBS_SITE_ID || process.env.SITE_ID;
const TOKEN = process.env.BLOBS_TOKEN;
function store(name: string) {
  if (SITE_ID && TOKEN) return getStore({ name, siteID: SITE_ID, token: TOKEN, consistency: "strong" });
  return getStore({ name, consistency: "strong" });
}
const assets = () => store("highlight-video-assets");
const chunks = () => store("highlight-video-chunks");

interface Asset {
  id: string;
  type: string;
  size: number;
  chunks: number;
  chunkSize: number;
  status: "uploading" | "ready";
}

export default async (req: Request, context: Context) => {
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const a = (await assets().get(context.params.id, { type: "json" })) as Asset | null;
  if (!a || a.status !== "ready") return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": a.type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  const chunkStore = chunks();
  const piece = (n: number) => chunkStore.get(`${a.id}/${n}`, { type: "arrayBuffer" }) as Promise<ArrayBuffer | null>;

  const range = req.headers.get("range");
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m) {
    let start: number, end: number;
    if (m[1] === "") { start = Math.max(0, a.size - Number(m[2])); end = a.size - 1; }
    else { start = Number(m[1]); end = m[2] === "" ? a.size - 1 : Math.min(Number(m[2]), a.size - 1); }
    if (start >= a.size || start > end) {
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${a.size}` } });
    }
    headers["Content-Range"] = `bytes ${start}-${end}/${a.size}`;
    headers["Content-Length"] = String(end - start + 1);
    if (req.method === "HEAD") return new Response(null, { status: 206, headers });
    const firstPiece = Math.floor(start / a.chunkSize);
    const lastPiece = Math.floor(end / a.chunkSize);
    if (firstPiece === lastPiece) {
      const pieceStart = firstPiece * a.chunkSize;
      const buf = await piece(firstPiece);
      if (!buf) return new Response("Missing data", { status: 500 });
      return new Response(buf.slice(start - pieceStart, end - pieceStart + 1), { status: 206, headers });
    }
    // The requested range spans more than one stored piece (common for an
    // open ended "bytes=X-" request a video player sends while buffering or
    // seeking) - a player expecting the rest of the file and only getting
    // one piece back has to make another round trip to keep going, which is
    // exactly what made clips slow to start and stall partway through.
    // Stream every piece the range touches in order, trimming only the
    // first and last to the exact requested boundaries.
    let n = firstPiece;
    const body = new ReadableStream({
      async pull(controller) {
        if (n > lastPiece) { controller.close(); return; }
        const buf = await piece(n);
        if (!buf) { controller.error(new Error("Missing data")); return; }
        const pieceStart = n * a.chunkSize;
        const sliceStart = n === firstPiece ? start - pieceStart : 0;
        const sliceEnd = n === lastPiece ? end - pieceStart + 1 : buf.byteLength;
        controller.enqueue(new Uint8Array(buf.slice(sliceStart, sliceEnd)));
        n++;
      }
    });
    return new Response(body, { status: 206, headers });
  }

  headers["Content-Length"] = String(a.size);
  if (req.method === "HEAD") return new Response(null, { status: 200, headers });
  if (a.chunks === 1) return new Response(await piece(0), { status: 200, headers });

  let n = 0;
  const body = new ReadableStream({
    async pull(controller) {
      if (n >= a.chunks) { controller.close(); return; }
      const buf = await piece(n++);
      if (!buf) { controller.error(new Error("Missing data")); return; }
      controller.enqueue(new Uint8Array(buf));
    },
  });
  return new Response(body, { status: 200, headers });
};

export const config = { path: "/player-videos/:id" };
