import { resolve } from "node:path";
import { Router } from "express";

export const authMdRouter = Router();

const AUTH_MD_PATH = resolve(import.meta.dirname, "../../../AUTH.md");

authMdRouter.get("/auth.md", (_req, res) => {
  res.type("text/markdown; charset=utf-8");
  res.sendFile(AUTH_MD_PATH);
});
