import express from "express";
import { config } from "./config.js";
import { initKeys } from "./keys.js";
import { grantsRouter } from "./routes/grants.js";
import { homeRouter } from "./routes/home.js";
import { sessionRouter } from "./routes/session.js";
import { tokenRouter } from "./routes/token.js";
import { wellKnownRouter } from "./routes/well-known.js";

function accessLog(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`,
    );
  });
  next();
}

async function main() {
  await initKeys();

  const app = express();
  app.use(express.json());
  app.use(accessLog);

  app.use(homeRouter);
  app.use(wellKnownRouter);
  app.use(sessionRouter);
  app.use(grantsRouter);
  app.use(tokenRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("[error]", err);
      if (res.headersSent) return;
      res.status(500).json({
        error: "internal_error",
        message: "An unexpected error occurred.",
      });
    },
  );

  app.listen(config.port, () => {
    console.log(`[provider] listening on ${config.issuer}`);
  });
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
