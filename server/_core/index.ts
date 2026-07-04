import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse as parseCookies } from "cookie";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerAuthRoutes } from "../auth";
import { initMissionScheduler } from "../missionScheduler";
import { securityHeadersMiddleware, cacheHeadersMiddleware } from "../cacheHeaders";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

async function main() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(securityHeadersMiddleware);
  app.use(cacheHeadersMiddleware);
  app.use(express.json());
  app.use((req, _res, next) => {
    const header = req.headers.cookie;
    (req as any).cookies = header ? parseCookies(header) : {};
    next();
  });

  registerAuthRoutes(app);

  app.use(
    "/api/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  if (isProduction) {
    // The esbuild bundle lands at dist/index.js, so __dirname here is
    // dist/ — the built client assets sit right alongside it at dist/public.
    const clientDist = path.resolve(__dirname, "public");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const projectRoot = path.resolve(__dirname, "../..");
    const vite = await createViteServer({
      configFile: path.resolve(projectRoot, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      try {
        const indexHtmlPath = path.resolve(projectRoot, "client", "index.html");
        const template = await vite.transformIndexHtml(req.originalUrl, await fs.readFile(indexHtmlPath, "utf-8"));
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  await initMissionScheduler().catch(error => {
    console.error("[Server] Failed to initialize mission scheduler:", error);
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`[Server] Redroom listening on port ${port} (${isProduction ? "production" : "development"})`);
  });
}

main().catch(error => {
  console.error("[Server] Fatal startup error:", error);
  process.exit(1);
});
