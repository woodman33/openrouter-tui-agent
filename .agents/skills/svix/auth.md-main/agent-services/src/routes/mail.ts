// DEMO-ONLY static serving for the .mail/ dir. Paired with src/mail.ts — it
// only exists so the browser can open the simulated confirmation email.
// In production the email is delivered by an email provider and this route
// has no analogue.
import { resolve } from "node:path";
import express, { Router } from "express";
import { config } from "../config.js";

export const mailRouter = Router();

mailRouter.use(
  config.mailUrlPath,
  express.static(resolve(config.mailDir), {
    extensions: ["html"],
    index: false,
    fallthrough: false,
  }),
);
