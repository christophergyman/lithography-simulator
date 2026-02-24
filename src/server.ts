import { join } from "path";

const PUBLIC_DIR = join(import.meta.dir, "public");
const PORT = Number(process.env.PORT) || 3000;

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'",
};

function cacheControl(ext: string): string {
  if (ext === ".html") return "no-cache";
  if (ext === ".js" || ext === ".css") return "public, max-age=3600";
  return "public, max-age=300";
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname === "/" ? "/index.html" : url.pathname;

    if (pathname === "/healthz") {
      return new Response("ok", { headers: { ...SECURITY_HEADERS } });
    }

    const filePath = join(PUBLIC_DIR, pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      return new Response("Forbidden", {
        status: 403,
        headers: { ...SECURITY_HEADERS },
      });
    }

    const file = Bun.file(filePath);
    if (await file.exists()) {
      const ext = pathname.slice(pathname.lastIndexOf("."));
      return new Response(file, {
        headers: {
          "Content-Type": MIME[ext] ?? "application/octet-stream",
          "Cache-Control": cacheControl(ext),
          ...SECURITY_HEADERS,
        },
      });
    }

    return new Response("Not Found", {
      status: 404,
      headers: { ...SECURITY_HEADERS },
    });
  },
});

console.log(`Lithography simulator running at http://localhost:${PORT}`);
