import type { Context } from "@netlify/functions";
import { media, lookupMedia } from "./_lib/madi-core.mts";

// GET /madi-media/:id  public file delivery with byte range support so video can stream and seek.
// Add ?download=1 to save the file instead of viewing it.
// Most bytes a single range request serves, however much of the file was
// actually asked for - keeps one invocation from having to stream an
// entire large file's worth of chunks before responding.
const MAX_RANGE_BYTES = 8 * 1024 * 1024;
export default async (req: Request, context: Context) => {
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const a = await lookupMedia(context.params.id);
  if (!a || a.status !== "ready") return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": a.type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable"
  };
  if (new URL(req.url).searchParams.has("download")) {
    const safe = a.name.replace(/[^\w. ]+/g, "_");
    headers["Content-Disposition"] = `attachment; filename="${safe}"`;
  }
  const store = media();
  const piece = (n: number) => store.get(`${a.id}/${n}`, { type: "arrayBuffer" }) as Promise<ArrayBuffer | null>;

  // Byte range request: stream from whichever stored piece(s) cover it.
  const range = req.headers.get("range");
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m) {
    let start: number, end: number;
    if (m[1] === "") { start = Math.max(0, a.size - Number(m[2])); end = a.size - 1; }
    else { start = Number(m[1]); end = m[2] === "" ? a.size - 1 : Math.min(Number(m[2]), a.size - 1); }
    if (start >= a.size || start > end) {
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${a.size}` } });
    }
    // A video element commonly asks for an open ended "bytes=X-" range,
    // meaning "the rest of the file". Honoring that literally would make
    // this one invocation await every remaining stored piece in sequence
    // before it can return anything - fine for a short clip, but for a
    // longer one that's enough sequential blob fetches to run past how
    // long a mobile client (or the function itself) will wait, which
    // surfaces as total playback failure rather than a slow stream.
    // Cap how much a single request serves; the player just issues
    // another range request to pick up where this one left off.
    end = Math.min(end, start + MAX_RANGE_BYTES - 1);
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

  // Whole file: stream the pieces in order.
  let n = 0;
  const body = new ReadableStream({
    async pull(controller) {
      if (n >= a.chunks) { controller.close(); return; }
      const buf = await piece(n++);
      if (!buf) { controller.error(new Error("Missing data")); return; }
      controller.enqueue(new Uint8Array(buf));
    }
  });
  return new Response(body, { status: 200, headers });
};

export const config = { path: "/madi-media/:id" };
