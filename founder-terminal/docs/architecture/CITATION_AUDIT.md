# TIMMY Architecture — Citation Audit Report

This document records the repaired citations pass performed on the systems architecture blueprint. It flags legacymismatched template references, explains the structural repairs, and maps them to clean developer specifications.

---

## 🔴 Flagged Corrupted Citations

In the legacy reference PDF/blueprint, multiple technical claims regarding `x-cmd`, `OpenHands`, `Cloudflare`, and `OpenRouter` were backed by footnotes citing unrelated Shopify, Faire, Hydrogen, and Presta Shop e-commerce blogs. These mismatched references have been audited and stripped:

1. **x-cmd core engine runtime**: 
   * *Mismatched Legacy Citation*: Footnotes citing Faire marketplace and Shopify wholesale blogs.
   * *Resolution*: Replaced with official `x-cmd` core modules listing and MiraclePlus (YC China) backings.
2. **OpenHands ~77% SWE-Bench score**:
   * *Mismatched Legacy Citation*: Footnotes pointing to generic Shopify developer APIs.
   * *Resolution*: Replaced with AllHandsAI's official blog posts and the arXiv V1 SDK paper (arXiv 2511.03690).
3. **Cloudflare Workers WebSocket Hibernation**:
   * *Mismatched Legacy Citation*: Footnotes citing Shopify Hydrogen and headless commerce setup guides.
   * *Resolution*: Replaced with Cloudflare runtime-apis Durable Objects specifications.
4. **OpenRouter Auto Exacto Quality Routing**:
   * *Mismatched Legacy Citation*: Footnotes pointing to generic headless e-commerce Shopify Oxygen tutorials.
   * *Resolution*: Replaced with OpenRouter's official announcements and Not Diamond provider routing specifications.

---

## 🟢 Clean Reference Mapping

Every claim inside our master **DOCTRINE.md** is now strictly bound to verified repositories, documentation portals, and primary packages detailed in **SOURCE_MAP.md**. Mismatched e-commerce links have been purged to ensure that all documentation is robust, professional, and ready for public and investor reviews.
