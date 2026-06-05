import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";
import {
  type Credential,
  type User,
  credentials,
  findCredential,
  users,
} from "./store.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      credential?: Credential;
    }
  }
}

function setChallenge(res: Response): void {
  res.set("WWW-Authenticate", `Bearer resource_metadata="${config.prmUrl}"`);
}

export function requireCredential(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.header("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    console.warn(
      `[auth] ${req.method} ${req.originalUrl}: missing Bearer credential`,
    );
    setChallenge(res);
    res.status(401).json({
      error: "unauthorized",
      message: "Missing Bearer credential.",
    });
    return;
  }
  const token = match[1]!;
  const credential = findCredential(token);
  if (!credential) {
    const raw = credentials.get(token);
    const reason = !raw
      ? `token ${token.slice(0, 8)}... unknown (${credentials.size} credentials in memory — server likely restarted since issuance)`
      : raw.revoked
        ? `token ${token.slice(0, 8)}... has been revoked`
        : `token ${token.slice(0, 8)}... expired`;
    console.warn(`[auth] ${req.method} ${req.originalUrl}: ${reason}`);
    setChallenge(res);
    res.status(401).json({
      error: "unauthorized",
      message: "Invalid, expired, or revoked credential.",
    });
    return;
  }
  if (credential.user_id) {
    const user = users.get(credential.user_id);
    if (!user) {
      console.warn(
        `[auth] ${req.method} ${req.originalUrl}: credential user ${credential.user_id} not found`,
      );
      setChallenge(res);
      res.status(401).json({
        error: "unauthorized",
        message: "Credential user not found.",
      });
      return;
    }
    req.user = user;
  }
  req.credential = credential;
  next();
}
