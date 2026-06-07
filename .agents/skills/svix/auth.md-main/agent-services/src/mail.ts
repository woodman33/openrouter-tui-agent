// DEMO-ONLY mail "delivery". Writes the OTP-view email HTML to disk so the
// browser can open it directly. A production consumer would hand the HTML to
// its actual email provider (SES, SendGrid, Postmark, ...) and surface none
// of this to the agent — the link is meant for the claiming user's inbox
// only.
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "./config.js";

export async function sendClaimViewEmail(input: {
  registrationId: string;
  recipientEmail: string;
  viewUrl: string;
  expiresAt: Date;
}): Promise<void> {
  const dir = resolve(config.mailDir);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${input.registrationId}.html`);
  await writeFile(path, renderHtml(input), "utf8");
  console.log(
    `[mail] wrote claim-view email for ${input.registrationId} to ${path}`,
  );
}

function renderHtml(input: {
  registrationId: string;
  recipientEmail: string;
  viewUrl: string;
  expiresAt: Date;
}): string {
  const { registrationId, recipientEmail, viewUrl, expiresAt } = input;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Confirm agent ownership</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1.5rem; line-height: 1.5; color: #222; }
  .meta { font-size: .85rem; color: #666; background: #f5f7fa; border: 1px solid #e2e6ec; border-radius: .3rem; padding: .6rem .75rem; }
  .cta { display: inline-block; background: #2e76f3; color: white; padding: .6rem 1.25rem; border-radius: .3rem; text-decoration: none; font-weight: 600; margin: 1.25rem 0; }
  code { background: #eef1f4; padding: .05rem .3rem; border-radius: .2rem; font-size: .9em; }
  .warn { font-size: .8rem; color: #8a6d3b; background: #fffbe6; border: 1px solid #ffe58f; padding: .5rem .75rem; border-radius: .3rem; margin-top: 1rem; }
</style>
</head>
<body>
<p>Hi ${escapeHtml(recipientEmail)},</p>
<p>An agent is asking to act on your behalf. If you recognize this request, click below to view a one-time code, then read the code back to the agent to confirm.</p>
<p class="warn">If you didn't request this, ignore the message. The agent will continue operating with limited scopes until the registration expires, and your email will not be associated with its credentials.</p>
<p><a class="cta" href="${escapeAttr(viewUrl)}">View one-time code</a></p>
<div class="meta">
  Registration: <code>${escapeHtml(registrationId)}</code><br>
  Link expires: ${escapeHtml(expiresAt.toISOString())}
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
