import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";
import { type User, sessions, users } from "./store.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.header("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    console.warn(
      `[auth] ${req.method} ${req.originalUrl}: missing Bearer session token`,
    );
    res.status(401).json({
      error: "unauthorized",
      message: "Missing Bearer session token.",
    });
    return;
  }
  const token = match[1]!;
  const session = sessions.get(token);
  if (!session) {
    console.warn(
      `[auth] ${req.method} ${req.originalUrl}: session token ${token.slice(0, 8)}... not found ` +
        `(${sessions.size} sessions in memory — server likely restarted since login)`,
    );
    res
      .status(401)
      .json({ error: "unauthorized", message: "Invalid or expired session." });
    return;
  }
  const ageMs = Date.now() - session.created_at.getTime();
  if (ageMs > config.sessionTtlSeconds * 1000) {
    sessions.delete(token);
    console.warn(
      `[auth] ${req.method} ${req.originalUrl}: session expired (age=${Math.floor(ageMs / 1000)}s, ttl=${config.sessionTtlSeconds}s)`,
    );
    res
      .status(401)
      .json({ error: "unauthorized", message: "Session expired." });
    return;
  }
  const user = users.get(session.user_id);
  if (!user) {
    console.warn(
      `[auth] ${req.method} ${req.originalUrl}: session user ${session.user_id} not found`,
    );
    res
      .status(401)
      .json({ error: "unauthorized", message: "Session user not found." });
    return;
  }
  req.user = user;
  next();
}
