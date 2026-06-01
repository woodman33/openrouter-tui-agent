# -*- coding: utf-8 -*-
"""Quiet Topology — the corpus. Accurate, concise documentation per instrument."""

RADAR_AXES = ["DX","RELIABILITY","VALUE","SIMPLICITY","DEVOTION","OPENNESS"]

# =========================================================== FEATURED (4 pages)
FEATURED = {
"stripe": {
  "name":"STRIPE","key":"stripe","founded":"2010",
  "primitive":"PaymentIntent","auth":"sk_live · pk_live",
  "anatomy":{
    "title":"The Payment Rail",
    "flow":["CARD","ELEMENTS","PAYMENT\nINTENT","NETWORK","ISSUER","PAYOUT"],
    "para":("A charge is never a single event but a graph of objects. The browser "
      "tokenises a card through Elements so raw numbers never touch your server. "
      "That token becomes a PaymentIntent — a state machine tracking authorisation, "
      "capture and confirmation across the card networks and the issuing bank. Money "
      "settles asynchronously; a Payout later sweeps the balance to a bank account. "
      "Every transition emits a webhook, the heartbeat by which the rest of your "
      "system learns what Stripe already knows."),
    "objects":[("PaymentIntent","pi_…"),("Charge","ch_…"),("Customer","cus_…"),
               ("Subscription","sub_…"),("Payout","po_…")],
    "layers_label":"THE SETTLEMENT LADDER",
    "layers":[("Acquirer","Stripe of record"),("Card network","Visa · MC · Amex"),
              ("Issuing bank","authorises funds"),("Balance","held, then swept"),
              ("Payout","T+2 to bank")],
    "stats":[("FOUNDED","2010"),("PRIMITIVE","PaymentIntent"),
             ("IDEMPOTENCY","keyed retries"),("EVENTS","webhooks")]},
  "operation":{
    "title":"Operating Stripe","ui":"app",
    "verbs":[("plus","create","Mint a PaymentIntent server-side with amount and currency."),
      ("ring","confirm","Client confirms; 3-D Secure runs if the issuer demands it."),
      ("arrow","capture","Settle an authorised amount, in full or in part."),
      ("filter","refund","Reverse a charge; funds return down the same rail."),
      ("doc","invoice","Bill a customer on a schedule via Billing."),
      ("gear","webhook","Subscribe to events; verify the signing secret.")],
    "para":("You operate Stripe from three surfaces: the Dashboard for humans, the REST "
      "API for code, and the Stripe CLI for the loop between them — `stripe listen` "
      "forwards live events to localhost. Test mode mirrors production exactly; keys "
      "carry their environment in their prefix. Idempotency keys make every write safe "
      "to retry, the quiet discipline behind money that must never double-charge."),
    "stats":[("SURFACES","Dashboard · API · CLI"),("MODE","test ⇄ live"),
             ("CLI","stripe listen"),("SAFETY","idempotency-key")]},
  "ecosystem":{
    "title":"The Stripe Surface",
    "groups":[("ACCEPT",["Checkout","Elements","Payment Links","Terminal"]),
      ("MANAGE",["Billing","Invoicing","Tax","Sigma"]),
      ("EXTEND",["Connect","Issuing","Radar","Identity"]),
      ("AGENTS",["MCP","Apps","Atlas"])],
    "para":("Around the rail, Stripe grew a continent. Connect splits payments across "
      "marketplaces; Radar scores fraud with a model trained on the network's whole "
      "volume; Terminal carries the same objects into physical card readers; Sigma lets "
      "you query it all in SQL. The newest member is an MCP server at mcp.stripe.com — "
      "the same primitives, now legible to AI agents that read and write your account."),
    "stats":[("MODULES","20+"),("FRAUD","Radar ML"),
             ("IN-PERSON","Terminal"),("AGENTIC","mcp.stripe.com")]},
  "sentiment":{
    "axes":[9.5,8.0,6.5,7.0,9.0,7.5],
    "themes":[("Documentation & DX",95,"+"),("API consistency",90,"+"),
      ("Breadth of products",84,"+"),("Pricing at scale",55,"-"),
      ("Account holds & risk",48,"-"),("Dispute support",52,"-")],
    "quote":"The API other APIs are measured against — you read the docs once and you simply know what to do.",
    "attrib":"— THE DEVELOPER CONSENSUS, COMPOSITE",
    "para":("Stripe is the rare infrastructure that developers describe with affection. "
      "The praise is remarkably consistent: documentation as a product, primitives that "
      "compose, a CLI that respects your time. The critique is just as steady — fees of "
      "2.9% + 30¢ that bite at scale, and a risk system that can freeze accounts with "
      "little warning. Reverence for the tool, wariness of the platform."),
    "timeline":[3,4,4,5,6,7,8,8,9,9,9,9],
    "stats":[("ARCHETYPE","gold standard"),("LOVED","docs · DX"),
             ("CONTESTED","fees · holds"),("VERDICT","reverence")]},
},

"notion": {
  "name":"NOTION","key":"notion","founded":"2016",
  "primitive":"the block","auth":"OAuth · integration token",
  "anatomy":{
    "title":"Everything Is A Block",
    "flow":["CHARACTER","BLOCK","PAGE","DATA\nSOURCE","DATABASE","WORKSPACE"],
    "para":("Notion has exactly one idea, pursued without compromise: the block. A "
      "paragraph is a block; so is an image, a toggle, a whole page. Blocks nest into a "
      "tree, and a page is simply a block that holds others. A database is a collection "
      "of pages sharing typed properties, queried through views. Because the model is "
      "uniform, anything can become anything — a checkbox today, a relation tomorrow — "
      "which is the source of both Notion's freedom and its sprawl."),
    "objects":[("Block","paragraph · toggle"),("Page","a block of blocks"),
               ("Database","typed pages"),("Property","title · relation"),
               ("View","table · board")],
    "layers_label":"THE BLOCK TREE",
    "layers":[("Workspace","the root"),("Teamspace","shared scope"),
              ("Page","a block of blocks"),("Database","typed collection"),
              ("Block","the atom")],
    "stats":[("FOUNDED","2016"),("MODEL","one block, nested"),
             ("QUERY","views"),("RELATE","relations + rollups")]},
  "operation":{
    "title":"Operating Notion","ui":"app",
    "verbs":[("plus","slash","Type / to summon any block inline — no menus."),
      ("grid","database","Turn a page into a table of typed records."),
      ("layers","view","Re-cut the same data as board, calendar, gallery."),
      ("branch","relate","Link records across databases; roll values up."),
      ("hash","formula","Compute fields with a spreadsheet-like language."),
      ("doc","template","Stamp out repeatable page structures.")],
    "para":("Operation is keyboard-first and improvisational. The slash command is the "
      "whole interface in miniature: every block type is a few keystrokes away. You "
      "shape a database once, then re-view it endlessly — the table, the board and the "
      "calendar are the same rows seen from different angles. Filters, sorts and "
      "relations turn a document into a small, legible application."),
    "stats":[("INPUT","slash command"),("VIEWS","6 kinds"),
             ("LOGIC","formulas"),("AI","Notion AI")]},
  "ecosystem":{
    "title":"The Notion Surface",
    "groups":[("CREATE",["AI","Web Clipper","Templates","Forms"]),
      ("CONNECT",["Public API","Connections","Embeds","Zapier"]),
      ("WORK",["Calendar","Mail","Projects","Wikis"]),
      ("SHARE",["Sites","Marketplace"])],
    "para":("The public API exposes the block tree to the outside world, so anything that "
      "can speak JSON can read and write a Notion page; that single decision spawned a "
      "marketplace of templates and a thicket of Zapier and Make automations. Notion AI "
      "now reads across the workspace, and Calendar and Mail extend the block idea into "
      "time and correspondence — the workspace quietly becoming an operating system."),
    "stats":[("API","blocks as JSON"),("MARKET","templates"),
             ("AI","workspace-aware"),("SUITE","Docs · Calendar · Mail")]},
  "sentiment":{
    "axes":[7.0,7.0,8.0,5.5,8.5,7.0],
    "themes":[("Flexibility",94,"+"),("All-in-one",88,"+"),("Aesthetics",85,"+"),
      ("Performance on big docs",50,"-"),("Offline & mobile",46,"-"),
      ("Tends toward sprawl",55,"-")],
    "quote":"It will be anything you want — which is exactly the problem, and exactly the point.",
    "attrib":"— THE POWER-USER PARADOX, COMPOSITE",
    "para":("Notion inspires devotion and exhaustion in equal measure. Users love that "
      "one tool replaces ten, and that it is genuinely beautiful to look at. The same "
      "freedom invites entropy: workspaces metastasise, and large databases can lag. "
      "Offline support and mobile have long trailed the desktop ideal. People stay "
      "anyway, because nothing else bends so willingly to the shape of a mind."),
    "timeline":[2,3,4,5,6,7,8,8,9,8,8,9],
    "stats":[("ARCHETYPE","the canvas"),("LOVED","flexibility"),
             ("CONTESTED","speed · sprawl"),("VERDICT","devotion")]},
},

"canva": {
  "name":"CANVA","key":"canva","founded":"2013",
  "primitive":"the design","auth":"OAuth · Connect API",
  "anatomy":{
    "title":"Design In The Cloud",
    "flow":["TEMPLATE","ELEMENTS","DESIGN\nDOC","RENDER","EXPORT","PUBLISH"],
    "para":("Canva treats a design as a cloud document: pages stacked with elements — "
      "text, shapes, images, video — each a layer with position, style and z-order. "
      "Editing is collaborative in real time, and rendering happens on Canva's servers, "
      "which is why a phone can output a print-ready PDF. Templates are simply designs "
      "with their content unlocked; the Magic Studio models generate and transform those "
      "elements on demand. Power without a manual is the entire thesis."),
    "objects":[("Design","pages of elements"),("Element","text · shape · media"),
               ("Brand Kit","logos · colours · fonts"),("Template","an unlocked design"),
               ("Export","PNG · PDF · MP4")],
    "layers_label":"THE RENDER PIPELINE",
    "layers":[("Document","pages + elements"),("Brand Kit","applied identity"),
              ("Magic Studio","AI generation"),("Server render","rasterise / encode"),
              ("Export","print · web · video")],
    "stats":[("FOUNDED","2013"),("MODEL","cloud document"),
             ("RENDER","server-side"),("AI","Magic Studio")]},
  "operation":{
    "title":"Operating Canva","ui":"canvas",
    "verbs":[("plus","drag","Pull elements onto the page; alignment guides snap."),
      ("layers","template","Start from a layout, swap content, keep the craft."),
      ("ring","brand","Apply the Brand Kit so everything stays on-identity."),
      ("bolt","magic","Generate images, resize, or remove a background by intent."),
      ("eye","present","Run the design as slides, or record a talking head."),
      ("arrow","export","Render to print, web, social or video formats.")],
    "para":("The interface is the product: a canvas, a left rail of assets, a top bar of "
      "context tools. You operate by direct manipulation — drag, snap, nudge — so the "
      "learning curve is nearly flat. Magic Resize re-flows one design into a dozen "
      "aspect ratios in a click, and the Brand Kit guarantees that a non-designer cannot "
      "easily go off-brand. Constraint disguised as ease."),
    "stats":[("METHOD","drag & drop"),("RESIZE","Magic, 1-click"),
             ("GUARD","Brand Kit"),("OUTPUT","print → video")]},
  "ecosystem":{
    "title":"The Canva Surface",
    "groups":[("MAKE",["Magic Studio","Photo Editor","Video","Whiteboard"]),
      ("SCALE",["Brand Templates","Teams","Bulk Create","Print"]),
      ("EXTEND",["Apps","Connect API","Dev Platform"]),
      ("LINK",["Drive","Slack","HubSpot"])],
    "para":("Canva widened from posters to a creative platform. The Apps marketplace lets "
      "third parties inject tools directly into the editor; the Connect API opens the "
      "design document to programmatic creation, so a system can mint a thousand "
      "on-brand variations unattended. Acquisitions — Affinity for professionals, "
      "Leonardo for generative models — signal an ambition well past the template."),
    "stats":[("EDITOR APPS","marketplace"),("API","Connect"),
             ("BULK","data → designs"),("M&A","Affinity · Leonardo")]},
  "sentiment":{
    "axes":[8.0,8.5,7.5,9.0,8.0,5.5],
    "themes":[("Accessibility for all",95,"+"),("Speed to a result",90,"+"),
      ("Template breadth",86,"+"),("Sameness of output",58,"-"),
      ("Pro-designer ceiling",54,"-"),("Asset licensing",50,"-")],
    "quote":"It made design a verb anyone could do — which thrills marketers and unsettles designers.",
    "attrib":"— THE DEMOCRATISATION DEBATE, COMPOSITE",
    "para":("Canva's sentiment splits cleanly by audience. For marketers, founders and "
      "teachers it is liberation: a professional artefact in minutes, no craft required. "
      "Working designers are warier, noting the gravitational pull toward template "
      "sameness and a ceiling on true control. Almost everyone agrees it has redrawn the "
      "floor of visual literacy for an entire generation of non-designers."),
    "timeline":[2,3,4,5,6,7,7,8,8,9,9,9],
    "stats":[("ARCHETYPE","the great leveller"),("LOVED","ease"),
             ("CONTESTED","ceiling · sameness"),("VERDICT","liberation")]},
},

"cloud": {
  "name":"CLOUDFLARE","key":"cloud","founded":"2009",
  "primitive":"the edge","auth":"API token · wrangler",
  "anatomy":{
    "title":"The Network At The Edge",
    "flow":["VISITOR","ANYCAST","NEAREST\nPOP","CACHE","WORKER","ORIGIN"],
    "para":("Cloudflare is a reverse proxy the size of the planet. Anycast routing means "
      "a single IP is announced from hundreds of cities at once, so a request lands at "
      "the nearest point of presence automatically. There it meets the cache, the "
      "firewall, and — crucially — your code. Workers run on V8 isolates rather than "
      "containers, sharing a process and starting in under a millisecond, which is how "
      "compute can live in every city without a fleet of idle servers."),
    "objects":[("Zone","a proxied domain"),("Worker","V8 isolate, edge code"),
               ("R2","object store, no egress"),("KV","eventual key-value"),
               ("D1","SQLite at the edge")],
    "layers_label":"THE EDGE STACK",
    "layers":[("Anycast","one IP, many cities"),("Cache & CDN","static at the edge"),
              ("WAF","traffic inspected"),("Workers","V8 isolates"),
              ("Storage","R2 · KV · D1 · DO")],
    "stats":[("FOUNDED","2009"),("FOOTPRINT","330+ cities"),
             ("COMPUTE","V8 isolates"),("COLD START","sub-ms")]},
  "operation":{
    "title":"Operating Cloudflare","ui":"app",
    "verbs":[("ring","proxy","Toggle the orange cloud; traffic flows through the edge."),
      ("gear","rules","Compose WAF, cache and transform rules as expressions."),
      ("bolt","deploy","`wrangler deploy` ships a Worker to every city at once."),
      ("cube","store","Bind R2, KV, D1 and Durable Objects straight into code."),
      ("filter","secure","Front apps with Zero Trust Access and Tunnels."),
      ("hash","observe","Read logs, analytics and traces from the dashboard.")],
    "para":("Operation begins with DNS: point a domain at Cloudflare, flip records to "
      "proxied, and the network is in the path. From there it is configuration as code — "
      "rulesets for traffic, and Wrangler for compute. A Worker binds its storage by "
      "name, so the database, the cache and the queue are objects in scope rather than "
      "endpoints to dial. The edge becomes a runtime, not just a shield."),
    "stats":[("ENTRY","DNS proxy"),("CLI","wrangler"),
             ("BIND","storage by name"),("MODEL","config-as-code")]},
  "ecosystem":{
    "title":"The Cloudflare Surface",
    "groups":[("COMPUTE",["Workers","Pages","Durable Objects","Queues"]),
      ("STORE",["R2","KV","D1","Vectorize"]),
      ("SECURE",["Access","Tunnel","WARP","Turnstile"]),
      ("AI",["Workers AI","AI Gateway","Sandbox"])],
    "para":("What began as a CDN is now a full developer cloud. Storage, queues and a "
      "SQLite database all live at the edge; Durable Objects give a single authoritative "
      "coordinator for state. The security half — Access, Tunnel, WARP — became a Zero "
      "Trust suite. Most recently Workers AI and the AI Gateway put inference and model "
      "routing in the same hundreds of cities as everything else."),
    "stats":[("ARC","CDN → cloud"),("STATEFUL","Durable Objects"),
             ("ZERO TRUST","Access · Tunnel"),("AI","Workers AI · Gateway")]},
  "sentiment":{
    "axes":[8.5,7.5,9.0,6.5,8.5,7.5],
    "themes":[("Free tier & value",94,"+"),("Edge performance",90,"+"),
      ("Workers DX",86,"+"),("Outage blast-radius",52,"-"),
      ("Support tiers",50,"-"),("Centralisation worry",55,"-")],
    "quote":"They put a server in every city and then gave most of it away — until the day a config takes half the web down.",
    "attrib":"— THE INFRASTRUCTURE AMBIVALENCE, COMPOSITE",
    "para":("Engineers admire Cloudflare with one eyebrow raised. The generosity of the "
      "free tier and the elegance of Workers earn genuine loyalty. Yet the very "
      "consolidation that makes it fast makes its rare global outages headline events, "
      "and reignites a standing debate about how much of the open web should pass "
      "through one company's network. Indispensable, and therefore scrutinised."),
    "timeline":[4,5,5,6,7,7,8,8,9,8,9,9],
    "stats":[("ARCHETYPE","the edge cloud"),("LOVED","value · speed"),
             ("CONTESTED","blast radius"),("VERDICT","indispensable")]},
},
}

# =========================================================== OTHERS (2 pages each)
OTHERS = {
"github":{
  "name":"GITHUB","key":"github","founded":"2008","primitive":"the commit",
  "tagline":"where the code, and its history, lives",
  "flow":["WORKING\nTREE","COMMIT","BRANCH","PULL\nREQUEST","REVIEW","MERGE"],
  "para_a":("Beneath GitHub sits Git: a directed acyclic graph of commits, each a "
    "content-addressed snapshot pointing at its parents. Branches are merely movable "
    "labels on that graph. GitHub wraps the graph in social ritual — the pull request — "
    "and in automation, where Actions spins up runners to test and ship every change."),
  "verbs":[("branch","branch","Fork the graph to work in isolation."),
    ("plus","commit","Snapshot the tree; the hash is its identity."),
    ("arrow","pull request","Propose a merge, open for review."),
    ("eye","review","Comment line-by-line; approve or request changes."),
    ("bolt","actions","Run CI/CD on runners, triggered by events."),
    ("ring","merge","Fold the branch back into the trunk.")],
  "groups":[("BUILD",["Actions","Packages","Codespaces","Pages"]),
    ("SECURE",["Dependabot","Code Scanning","Secrets"]),
    ("AI",["Copilot","Copilot Chat","Models"]),
    ("EXTEND",["Marketplace","Apps","REST · GraphQL"])],
  "para_b":("The Marketplace turned CI steps into shared, installable Actions, and "
    "Codespaces moved the whole development environment into the browser. Copilot put a "
    "model in the editor and the pull request. Owned by Microsoft since 2018, GitHub is "
    "now less a host than the default substrate of how software is made."),
  "axes":[9.0,8.5,8.0,7.0,9.0,7.0],
  "themes":[("Ubiquity & network",96,"+"),("Pull-request workflow",92,"+"),
    ("Actions ecosystem",84,"+"),("Actions billing",54,"-"),("Copilot debate",58,"-")],
  "quote":"The town square of code — you do not choose to be here so much as you already are.",
  "attrib":"— THE DEFAULT SUBSTRATE, COMPOSITE",
  "stats_a":[("ENGINE","Git DAG"),("RITUAL","pull request"),("CI","Actions"),("OWNER","Microsoft")],
  "stats_b":[("LOVED","ubiquity"),("CONTESTED","CI cost · AI"),("AI","Copilot"),("VERDICT","inescapable")]},

"figma":{
  "name":"FIGMA","key":"figma","founded":"2012","primitive":"the frame",
  "tagline":"design as a place, not a file",
  "flow":["CANVAS","FRAME","LAYER","COMPONENT","VARIANT","PROTOTYPE"],
  "para_a":("Figma runs the design surface in the browser on a WebGL canvas, with a "
    "multiplayer engine that merges everyone's edits in real time — design as a shared "
    "place rather than a file passed around. The document is a tree of frames and "
    "layers; components and variants make that tree reusable, and auto-layout lets it "
    "respond to content like a living interface."),
  "verbs":[("layers","frame","Bound a region; nest layers within."),
    ("ring","component","Define once, instance everywhere."),
    ("grid","variants","Collapse states into a single component set."),
    ("arrow","auto-layout","Let frames resize and reflow to content."),
    ("eye","prototype","Wire flows and transitions between frames."),
    ("hash","dev mode","Hand engineers specs, tokens and code.")],
  "groups":[("DESIGN",["Components","Variables","Auto-Layout","FigJam"]),
    ("SHIP",["Dev Mode","Code Connect","Figma Make"]),
    ("EXTEND",["Plugins","Widgets","REST API","MCP"]),
    ("LINK",["Slack","Jira","GitHub"])],
  "para_b":("A community of plugins and widgets turned Figma into a platform; Dev Mode "
    "and Code Connect close the loop to code; and an MCP server now lets agents read the "
    "design context directly. After the Adobe acquisition was abandoned, Figma stayed "
    "independent and kept expanding — into whiteboards, slides, and AI-assisted making."),
  "axes":[8.5,8.0,7.0,7.5,9.0,7.5],
  "themes":[("Multiplayer & collaboration",94,"+"),("Component system",90,"+"),
    ("Browser-native",85,"+"),("Pricing & seats",55,"-"),("Huge-file performance",58,"-")],
  "quote":"It killed the export-and-email ritual; the design simply lives at a URL everyone shares.",
  "attrib":"— THE COLLABORATIVE TURN, COMPOSITE",
  "stats_a":[("RUNTIME","WebGL canvas"),("SYNC","multiplayer"),("REUSE","components"),("HANDOFF","Dev Mode")],
  "stats_b":[("LOVED","real-time"),("CONTESTED","seat pricing"),("AGENTIC","MCP"),("VERDICT","the standard")]},

"slack":{
  "name":"SLACK","key":"slack","founded":"2013","primitive":"the message",
  "tagline":"the company as an event stream",
  "flow":["MESSAGE","CHANNEL","THREAD","EVENT API","BOT","WORKFLOW"],
  "para_a":("Slack models an organisation as a stream of messages partitioned into "
    "channels. Underneath, it is an event bus: the Events API pushes every relevant "
    "occurrence to subscribed apps, which reply with Block Kit, the JSON grammar for "
    "interactive surfaces. Slash commands and bots make the chat window a command line "
    "for the whole company."),
  "verbs":[("plus","channel","Carve a topic; public, private or shared."),
    ("branch","thread","Reply in place; keep the channel calm."),
    ("bolt","slash","Invoke an app with a typed command."),
    ("gear","workflow","Automate steps with no code."),
    ("arrow","webhook","Post into Slack from any system."),
    ("ring","huddle","Drop into lightweight live audio.")],
  "groups":[("BUILD",["Bolt SDK","Block Kit","Workflow Builder"]),
    ("CONNECT",["Events API","Webhooks","Slack Connect"]),
    ("WORK",["Canvas","Lists","Huddles","Search"]),
    ("EXTEND",["App Directory","AI"])],
  "para_b":("The App Directory made Slack a hub where other tools announce themselves — a "
    "deploy here, a ticket there — so the chat log doubles as a system of record. Owned "
    "by Salesforce since 2021, it has layered on canvases, lists and AI search, drifting "
    "from messenger toward a work operating system."),
  "axes":[8.0,8.0,6.5,7.5,7.5,7.0],
  "themes":[("Integrations hub",92,"+"),("Search & history",84,"+"),
    ("App platform",82,"+"),("Notification overload",48,"-"),("Pricing per seat",54,"-")],
  "quote":"It connected every tool you own and then never let you look away from any of them.",
  "attrib":"— THE ALWAYS-ON LEDGER, COMPOSITE",
  "stats_a":[("MODEL","event bus"),("GRAMMAR","Block Kit"),("SDK","Bolt"),("OWNER","Salesforce")],
  "stats_b":[("LOVED","integrations"),("CONTESTED","overload"),("DRIFT","work OS"),("VERDICT","central")]},

"shopify":{
  "name":"SHOPIFY","key":"shopify","founded":"2006","primitive":"the store",
  "tagline":"commerce as a programmable platform",
  "flow":["PRODUCT","STOREFRONT","CART","CHECKOUT","ORDER","FULFILMENT"],
  "para_a":("Shopify splits a store into the storefront customers see and the admin "
    "merchants run. Themes render in Liquid, a templating language that fills HTML with "
    "store data; the Admin GraphQL API exposes the same catalogue, orders and inventory "
    "to code. Checkout is Shopify's crown jewel — tuned, hosted, and now extended only "
    "through sandboxed Functions written in WebAssembly."),
  "verbs":[("plus","product","Define items, variants and inventory."),
    ("doc","theme","Shape the storefront in Liquid."),
    ("gear","function","Extend checkout with WASM logic."),
    ("arrow","order","Capture, fulfil and track a sale."),
    ("cube","markets","Sell across regions and currencies."),
    ("ring","app","Install capability from the App Store.")],
  "groups":[("BUILD",["Liquid Themes","Functions","Hydrogen","Oxygen"]),
    ("SELL",["Checkout","Markets","POS","Payments"]),
    ("EXTEND",["App Store","Admin GraphQL","Storefront API"]),
    ("SCALE",["Plus","Flow","B2B"])],
  "para_b":("The App Store turned every merchant need into an installable business, and "
    "Functions replaced brittle script editors with safe, fast WebAssembly extensions. "
    "Hydrogen and Oxygen offer a headless path for teams that want React storefronts on "
    "Shopify's commerce engine. The platform sells the hard parts — checkout, payments, "
    "fraud — and rents the rest."),
  "axes":[8.0,8.5,7.0,7.5,8.0,7.0],
  "themes":[("Time-to-store",90,"+"),("Checkout conversion",88,"+"),
    ("App ecosystem",84,"+"),("Stacking app fees",52,"-"),("Theme dev friction",55,"-")],
  "quote":"It sells you the one thing you cannot build yourself — a checkout the whole world already trusts.",
  "attrib":"— THE MERCHANT'S BARGAIN, COMPOSITE",
  "stats_a":[("SPLIT","storefront · admin"),("TEMPLATE","Liquid"),("EXTEND","WASM Functions"),("API","GraphQL")],
  "stats_b":[("LOVED","checkout"),("CONTESTED","app costs"),("HEADLESS","Hydrogen"),("VERDICT","the default")]},

"vercel":{
  "name":"VERCEL","key":"vercel","founded":"2015","primitive":"the deployment",
  "tagline":"git push becomes a URL",
  "flow":["GIT PUSH","BUILD","PREVIEW\nURL","EDGE","FLUID\nCOMPUTE","PROMOTE"],
  "para_a":("Vercel turns a git push into a running URL. Every commit builds an immutable "
    "deployment with its own preview link, so a branch is reviewable as a live site, not "
    "a diff. Requests are served from a global edge, and Fluid Compute runs full Node "
    "and Python functions that reuse instances across requests — cutting cold starts "
    "while keeping the serverless billing model."),
  "verbs":[("branch","connect","Link a repo; pushes deploy themselves."),
    ("arrow","preview","Every branch gets a shareable live URL."),
    ("gear","env","Manage secrets per environment."),
    ("bolt","function","Run server code on Fluid Compute."),
    ("ring","promote","Ship a preview to production atomically."),
    ("eye","observe","Read logs, traces and analytics.")],
  "groups":[("SHIP",["Deployments","Preview URLs","Rolling Releases"]),
    ("COMPUTE",["Fluid Compute","Middleware","Cron","Queues"]),
    ("AI",["AI Gateway","AI SDK","v0","Sandbox"]),
    ("STORE",["Blob","Marketplace DBs"])],
  "para_b":("Vercel authors Next.js, so the framework and the platform evolve in lockstep "
    "— a strength its admirers prize and its critics distrust. Lately the company pushed "
    "into AI: the AI SDK and a provider-agnostic AI Gateway, v0 for generative UIs, and "
    "Sandbox for running untrusted code. The deployment primitive, extended to agents."),
  "axes":[9.0,8.0,6.0,7.5,8.5,6.5],
  "themes":[("Frontend DX",93,"+"),("Preview deployments",90,"+"),
    ("Edge & Fluid Compute",84,"+"),("Bandwidth pricing",50,"-"),("Next.js lock-in worry",56,"-")],
  "quote":"The preview URL changed code review forever — you stopped imagining the change and just clicked it.",
  "attrib":"— THE FRONTEND CLOUD, COMPOSITE",
  "stats_a":[("UNIT","deployment"),("REVIEW","preview URL"),("COMPUTE","Fluid"),("MAKES","Next.js")],
  "stats_b":[("LOVED","DX"),("CONTESTED","cost · lock-in"),("AI","Gateway · v0"),("VERDICT","beloved")]},

"linear":{
  "name":"LINEAR","key":"linear","founded":"2019","primitive":"the issue",
  "tagline":"software made to feel instant",
  "flow":["ISSUE","TRIAGE","CYCLE","PROJECT","ROADMAP","RELEASE"],
  "para_a":("Linear's distinguishing trait is felt before it is understood: it is fast. A "
    "local-first sync engine applies changes optimistically on the client and "
    "reconciles in the background, so the interface never waits on a network. The model "
    "is deliberately small — issues move through cycles toward projects — and the whole "
    "tool is navigable from the keyboard."),
  "verbs":[("plus","issue","Capture work; assignee, status, estimate."),
    ("filter","triage","Sort the inbox into the plan."),
    ("ring","cycle","Time-box a sprint of issues."),
    ("layers","project","Group issues toward an outcome."),
    ("arrow","roadmap","Sequence projects over quarters."),
    ("bolt","command","Drive everything from cmd-K.")],
  "groups":[("PLAN",["Cycles","Projects","Roadmaps","Triage"]),
    ("CONNECT",["GitHub","Slack","Figma","Sentry"]),
    ("EXTEND",["GraphQL API","Webhooks","Asks"]),
    ("AI",["Agents"])],
  "para_b":("Linear keeps its surface small on purpose, then connects outward: pull "
    "requests close issues, Slack relays updates, Figma frames attach to tickets. The "
    "GraphQL API and webhooks let teams build the rest. It is opinionated where Jira is "
    "configurable — a philosophy, not just a tracker."),
  "axes":[9.0,9.0,7.0,8.5,8.5,6.5],
  "themes":[("Speed & responsiveness",96,"+"),("Design & focus",92,"+"),
    ("Keyboard workflow",88,"+"),("Opinionated, less custom",54,"-"),("B2B only",50,"-")],
  "quote":"It is the first project tracker that respects your time instead of consuming it.",
  "attrib":"— THE SPEED DOCTRINE, COMPOSITE",
  "stats_a":[("ENGINE","local-first sync"),("FEEL","instant"),("INPUT","cmd-K"),("API","GraphQL")],
  "stats_b":[("LOVED","speed · design"),("CONTESTED","opinionated"),("AI","Agents"),("VERDICT","adored")]},

"airtable":{
  "name":"AIRTABLE","key":"airtable","founded":"2012","primitive":"the record",
  "tagline":"a spreadsheet that learned to relate",
  "flow":["FIELD","RECORD","TABLE","LINK","VIEW","INTERFACE"],
  "para_a":("Airtable looks like a spreadsheet but behaves like a database. Each column "
    "is a typed field; rows are records that can link to records in other tables, giving "
    "true relations a grid alone cannot. Views re-present the same records as grids, "
    "kanban boards, calendars or galleries, and Interfaces compose those views into "
    "lightweight apps for people who never see the underlying base."),
  "verbs":[("grid","field","Type a column: text, link, formula, attachment."),
    ("plus","record","Add a row; relate it across tables."),
    ("branch","link","Connect records into a relational web."),
    ("layers","view","See the data as grid, board or calendar."),
    ("gear","automation","Trigger actions on record changes."),
    ("eye","interface","Build an app face over the base.")],
  "groups":[("MODEL",["Tables","Linked Records","Formulas","Rollups"]),
    ("SEE",["Grid","Kanban","Calendar","Interfaces"]),
    ("RUN",["Automations","Scripting","Sync"]),
    ("EXTEND",["Marketplace","REST API","AI"])],
  "para_b":("The marketplace, scripting block and REST API let teams extend a base into a "
    "real internal tool, and Automations handle the glue without code. Airtable's bet is "
    "that most software begins as a table somebody shared — and that giving that table "
    "relations, views and logic covers a surprising amount of business."),
  "axes":[7.5,8.0,6.0,8.0,7.5,7.0],
  "themes":[("Approachable database",90,"+"),("Views & interfaces",86,"+"),
    ("No-code automations",80,"+"),("Per-seat & record limits",48,"-"),("Cost at scale",50,"-")],
  "quote":"It let a non-engineer build the thing they would otherwise have begged engineering for.",
  "attrib":"— THE CITIZEN DATABASE, COMPOSITE",
  "stats_a":[("LOOKS","spreadsheet"),("IS","relational db"),("RE-VIEW","6 lenses"),("APP","Interfaces")],
  "stats_b":[("LOVED","accessible"),("CONTESTED","pricing"),("RUN","automations"),("VERDICT","empowering")]},

"zapier":{
  "name":"ZAPIER","key":"zapier","founded":"2011","primitive":"the zap",
  "tagline":"the connective tissue between everything",
  "flow":["TRIGGER","FILTER","PATH","ACTION","FORMAT","DELIVER"],
  "para_a":("Zapier is automation as plumbing: a trigger in one app starts a flow of "
    "actions in others. Triggers arrive instantly by webhook or by polling on a "
    "schedule; between them, filters gate the flow, paths branch it, and the Formatter "
    "reshapes data so two systems that never agreed on a schema can still speak. With "
    "thousands of integrations, Zapier is less an app than a switchboard."),
  "verbs":[("bolt","trigger","Start a Zap when something happens."),
    ("filter","filter","Continue only when conditions hold."),
    ("branch","path","Branch into conditional routes."),
    ("arrow","action","Do something in another app."),
    ("gear","format","Reshape text, numbers and dates."),
    ("ring","agent","Let an AI agent act across apps.")],
  "groups":[("FLOW",["Zaps","Paths","Filters","Formatter"]),
    ("DATA",["Tables","Interfaces","Storage"]),
    ("AI",["Agents","Chatbots","Copilot"]),
    ("REACH",["8000+ Apps","Webhooks","Code"])],
  "para_b":("With more integrations than any rival, Zapier became the default glue for the "
    "long tail of software — the app that ships when no native integration exists. It "
    "has since grown a database (Tables), front-ends (Interfaces) and AI Agents, "
    "reaching toward the workflows it once only connected."),
  "axes":[7.5,8.0,5.5,8.0,7.0,8.5],
  "themes":[("Breadth of integrations",95,"+"),("No-code accessibility",88,"+"),
    ("Time saved",84,"+"),("Task-based pricing",46,"-"),("Debugging long Zaps",52,"-")],
  "quote":"It is the duct tape holding the modern software stack together — and everyone owns a roll.",
  "attrib":"— THE UNIVERSAL GLUE, COMPOSITE",
  "stats_a":[("ROLE","switchboard"),("TRIGGERS","webhook · poll"),("RESHAPE","Formatter"),("REACH","8000+ apps")],
  "stats_b":[("LOVED","breadth"),("CONTESTED","task pricing"),("AI","Agents"),("VERDICT","ubiquitous glue")]},

"google":{
  "name":"GOOGLE WORKSPACE","key":"google","founded":"2006","primitive":"the doc",
  "tagline":"collaboration as a default state",
  "flow":["DOC","SHARE","CO-EDIT","COMMENT","DRIVE","SCRIPT"],
  "para_a":("Workspace made simultaneous editing ordinary. Behind Docs and Sheets sits "
    "operational transformation: concurrent edits are rewritten against one another so "
    "every cursor converges on the same document without locking. Drive is the shared "
    "filesystem and permission model beneath it all, and Apps Script lets that "
    "filesystem run code — turning a spreadsheet into a small automated service."),
  "verbs":[("doc","create","Open a doc, sheet, slide or form."),
    ("arrow","share","Grant view, comment or edit by link."),
    ("ring","co-edit","Edit together; cursors converge live."),
    ("eye","comment","Discuss in the margin; assign tasks."),
    ("cube","drive","Store, search and organise files."),
    ("gear","script","Automate with Apps Script.")],
  "groups":[("CREATE",["Docs","Sheets","Slides","Forms"]),
    ("COMMUNICATE",["Gmail","Calendar","Meet","Chat"]),
    ("EXTEND",["Apps Script","APIs","AppSheet"]),
    ("AI",["Gemini"])],
  "para_b":("The Marketplace and Apps Script open Workspace to extension, and public APIs "
    "let external systems read and write Drive, Calendar and Gmail — which is why so "
    "many tools offer a Google sign-in and a Drive picker. Gemini now threads through "
    "every surface, drafting and summarising inside the documents themselves."),
  "axes":[7.5,9.0,8.0,8.5,8.0,7.5],
  "themes":[("Real-time collaboration",94,"+"),("Reliability & reach",92,"+"),
    ("Zero setup",86,"+"),("Admin complexity",55,"-"),("Privacy questions",52,"-")],
  "quote":"It made 'send me the file' obsolete; the file was always already shared.",
  "attrib":"— THE SHARED DEFAULT, COMPOSITE",
  "stats_a":[("SYNC","operational transform"),("BASE","Drive"),("CODE","Apps Script"),("AI","Gemini")],
  "stats_b":[("LOVED","collaboration"),("CONTESTED","privacy"),("REACH","ubiquitous"),("VERDICT","the default")]},

"datadog":{
  "name":"DATADOG","key":"datadog","founded":"2010","primitive":"the signal",
  "tagline":"making the running system visible",
  "flow":["AGENT","METRIC","TRACE","LOG","DASHBOARD","MONITOR"],
  "para_a":("Datadog watches systems that are otherwise opaque. An agent on each host "
    "collects the three pillars — metrics, distributed traces, and logs — and ships them "
    "to a platform that correlates them by shared tags. A spike on a dashboard links to "
    "the trace that caused it, which links to the log line that explains it. Monitors "
    "then watch the signals and raise alerts before humans would notice."),
  "verbs":[("cube","agent","Install once; it gathers everything."),
    ("hash","metric","Track rates, gauges and histograms."),
    ("branch","trace","Follow a request across services."),
    ("doc","log","Search structured events at volume."),
    ("grid","dashboard","Compose the signals into a view."),
    ("eye","monitor","Alert on thresholds and anomalies.")],
  "groups":[("OBSERVE",["APM","Logs","Metrics","RUM"]),
    ("OPERATE",["Monitors","Dashboards","Incident","SLOs"]),
    ("SECURE",["Cloud SIEM","CSM","App Security"]),
    ("AI",["LLM Observability","MCP"])],
  "para_b":("Eight hundred integrations mean Datadog speaks to nearly any cloud service "
    "out of the box, and the platform has expanded from monitoring into security and, "
    "lately, LLM observability — tracing the behaviour of AI applications themselves. An "
    "MCP server now lets agents query the same telemetry that on-call engineers do."),
  "axes":[8.0,8.5,5.0,6.5,7.5,7.5],
  "themes":[("Breadth & correlation",92,"+"),("Single pane of glass",86,"+"),
    ("Integrations",84,"+"),("Bill shock",40,"-"),("Pricing complexity",46,"-")],
  "quote":"It shows you everything happening in your system — and then shows you the invoice.",
  "attrib":"— THE OBSERVABILITY BARGAIN, COMPOSITE",
  "stats_a":[("PILLARS","metric · trace · log"),("COLLECT","agent"),("CORRELATE","tags"),("ALERT","monitors")],
  "stats_b":[("LOVED","power"),("CONTESTED","cost"),("AI","LLM Obs · MCP"),("VERDICT","powerful, pricey")]},
}
