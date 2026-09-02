import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export function createStaticHandler(root) {
  const absoluteRoot = resolve(root);

  return async function serveStatic(request, response) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      notFound(response);
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      notFound(response);
      return;
    }
    const requested = resolve(absoluteRoot, `.${pathname}`);
    if (requested !== absoluteRoot && !requested.startsWith(`${absoluteRoot}${sep}`)) {
      notFound(response);
      return;
    }

    let file = requested;
    if (pathname === "/" || !(await isFile(file))) {
      if (pathname !== "/" && extname(pathname)) {
        notFound(response);
        return;
      }
      file = resolve(absoluteRoot, "index.html");
    }
    if (!await isFile(file)) {
      notFound(response);
      return;
    }

    const contents = await readFile(file);
    response.statusCode = 200;
    response.setHeader("Content-Type", CONTENT_TYPES[extname(file)] ?? "application/octet-stream");
    response.setHeader("Content-Length", String(contents.length));
    if (file.endsWith("index.html")) {
      response.setHeader("Cache-Control", "no-cache");
    } else {
      response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    response.end(request.method === "HEAD" ? undefined : contents);
  };
}

async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

function notFound(response) {
  response.statusCode = 404;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end("Not found\n");
}
