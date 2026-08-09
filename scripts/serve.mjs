#!/usr/bin/env node
/**
 * Tiny static file server (Node builtins only).
 * Serves the repo root so index.html can load /dist/*.js as ES modules.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 5173;

const TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".map", "application/json"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
]);

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";

  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end("Not found");
      return;
    }
    const type = TYPES.get(path.extname(file)) ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type }).end(data);
  });
});

server.listen(port, () => {
  console.log(`Button Presser → http://localhost:${port}`);
});
