# Cloudflare & Cloud Infrastructure Terminal/TUI Tools — Comprehensive Research Report

> **Research Date**: 2025-06  
> **Facet**: Cloudflare ecosystem, edge computing, cloud infrastructure TUI apps  
> **Searches Conducted**: 18 independent queries across web search  
> **Sources**: GitHub, official docs, terminaltrove.com, freecodecamp.org, HN, medium.com, dev.to, vercel.com, netlify.com, fly.io

---

## Table of Contents

1. [Executive Summary & Ranked Recommendations](#1-executive-summary--ranked-recommendations)
2. [Cloudflare Official CLI Tools](#2-cloudflare-official-cli-tools)
3. [Cloudflare TUI/Dashboard Tools](#3-cloudflare-tuidashboard-tools)
4. [DNS Management CLI Tools](#4-dns-management-cli-tools)
5. [R2 Storage TUI Tools](#5-r2-storage-tui-tools)
6. [D1 Database TUI Tools](#6-d1-database-tui-tools)
7. [KV Store Management](#7-kv-store-management)
8. [Workers Debugging & Monitoring](#8-workers-debugging--monitoring)
9. [Pages Deployment Tools](#9-pages-deployment-tools)
10. [Tunnel & Load Balancer Management](#10-tunnel--load-balancer-management)
11. [Edge Deployment CLIs (Fly.io, Vercel, Netlify)](#11-edge-deployment-clis)
12. [Kubernetes/Cloud-Native TUI Tools](#12-kubernetescloud-native-tui-tools)
13. [IaC TUI Tools (Terraform/Pulumi)](#13-iac-tui-tools)
14. [Other Notable Infrastructure TUIs](#14-other-notable-infrastructure-tuis)
15. [Complete Tool Rankings Table](#15-complete-tool-rankings-table)

---

## 1. Executive Summary & Ranked Recommendations

### Top-Tier "Must-Have" Tools (Score: 9-10/10)

| Rank | Tool | Category | Why |
|------|------|----------|-----|
| 1 | **wrangler** (v4.x) | Cloudflare Workers/Pages CLI | Official, essential, ~44K weekly npm downloads, full Workers/Pages/R2/D1/KV lifecycle management [^1165^] |
| 2 | **cloudflared** | Tunnel CLI | Official, core infrastructure tool for secure tunnels, extensive CLI commands [^1103^] |
| 3 | **rclone** (+ ncdu TUI) | Multi-cloud storage | Swiss army knife for cloud storage, built-in `ncdu`-style TUI, first-class R2 support [^1276^] |
| 4 | **doggo** | DNS client | Modern DNS-over-HTTPS/DoT/DoQ client, Go-based, actively maintained, excellent output formatting [^1172^] |
| 5 | **k9s** | Kubernetes TUI | Gold standard for K8s TUI management, real-time cluster monitoring, extensive plugin ecosystem [^1291^] |

### Strong "Recommended" Tools (Score: 7-8/10)

| Rank | Tool | Category | Why |
|------|------|----------|-----|
| 6 | **s3duck-tui** | S3/R2 storage TUI | Purpose-built TUI S3 client in Go (tview/tcell), bucket browsing, downloads [^1125^] |
| 7 | **sqlit-tui** (sqlit) | Multi-database TUI | Supports Cloudflare D1 natively, "lazygit of SQL databases", Python/Textual-based [^969^] |
| 8 | **flyctl** | Fly.io CLI | Comprehensive edge deployment CLI with `fly status`, `fly logs`, `fly dashboard` [^1284^] |
| 9 | **wrangler-action** | CI/CD GitHub Action | Official GitHub Action for Cloudflare Workers/Pages deployment, widely adopted [^1157^] |
| 10 | **dog** (Rust) | DNS client | Elegant Rust DNS client, DoH/DoT support, colorized output (maintenance concerns — see community fork) [^1168^] |

### Good "Worth Trying" Tools (Score: 5-6/10)

| Rank | Tool | Category | Why |
|------|------|----------|-----|
| 11 | **netlify-cli** | Netlify deployment | Mature CLI with `deploy`, `dev`, `sites:list`, `--allow-anonymous` flag [^1198^] |
| 12 | **vercel-cli** | Vercel deployment | `vercel list`, `vercel logs`, `vercel deploy`, but no full TUI dashboard [^1204^] |
| 13 | **cloudflare-cli4 (cli4)** | Cloudflare API CLI | Full API v4 access via CLI, Python-based, can access analytics [^1315^] |
| 14 | **k9sight** | Kubernetes debugging | Fast, keyboard-driven TUI for debugging K8s workloads [^1278^] |
| 15 | **buoy** | Kubernetes dashboard | Declarative K8s dashboard in terminal (JSON config) [^1161^] |

### Emerging/Experimental (Score: 3-4/10)

| Rank | Tool | Category | Why |
|------|------|----------|-----|
| 16 | **statusflare** | Cloudflare status monitoring | Serverless status page built ON Cloudflare Workers/D1/R2 (meta use case) [^1285^] |
| 17 | **dog_community (doge)** | DNS client | Community fork of `dog` DNS client, trying to revive the project [^1174^] |

---

## 2. Cloudflare Official CLI Tools

### 2.1 Wrangler (v4.x) — The Primary Cloudflare Developer CLI

**GitHub**: `cloudflare/workers-sdk` [^1165^]  
**Language**: TypeScript/Node.js  
**npm**: ~44K weekly downloads  
**Latest**: v4.94.0 (May 2025) [^1169^]

**Core Packages in workers-sdk monorepo**:
| Package | Purpose |
|---------|---------|
| `wrangler` | CLI for building/deploying Workers |
| `create-cloudflare` (C3) | CLI scaffolding tool for new projects |
| `miniflare` | Local Workers simulator |
| `@cloudflare/vite-plugin` | Vite integration |
| `@cloudflare/vitest-pool-workers` | Testing utilities |

**Key Commands for TUI-like Workflows**:

```bash
# Workers lifecycle
npx wrangler init my-worker
npx wrangler dev                    # Local dev server with hot reload
npx wrangler deploy                 # Deploy to edge
npx wrangler tail                   # Real-time log streaming (JSON output)
npx wrangler tail --format pretty   # Human-readable logs
npx wrangler tail --status error    # Filter by status

# D1 Database
npx wrangler d1 create my-db
npx wrangler d1 execute my-db --file=./schema.sql
npx wrangler d1 execute my-db --command "SELECT * FROM users"
npx wrangler d1 execute my-db --remote --file=./schema.sql

# R2 Storage
npx wrangler r2 bucket create my-bucket
npx wrangler r2 bucket list
npx wrangler r2 object put my-bucket/file.txt --file ./local.txt
npx wrangler r2 object list my-bucket

# KV Store
npx wrangler kv namespace create "MY_KV"
npx wrangler kv namespace list
npx wrangler kv key put --namespace-id=xxxx "my-key" "my-value"
npx wrangler kv key get --namespace-id=xxxx "my-key"
npx wrangler kv key delete --namespace-id=xxxx "my-key"

# Pages
npx wrangler pages project create
npx wrangler pages deploy <BUILD_DIR>
npx wrangler pages deployment list
npx wrangler pages deployment tail  # Real-time Pages Functions logs

# Secrets & Config
npx wrangler secret put API_KEY
npx wrangler secret list
npx wrangler vars put MY_VAR "value"
npx wrangler vars list

# Debugging
npx wrangler dev --inspector-port 9229  # Chrome DevTools integration
npx wrangler deployments list
npx wrangler rollback <DEPLOYMENT_ID>
```

**TUI Affordances**: While wrangler itself is a traditional CLI (not a TUI), it provides rich interactive experiences through:
- `wrangler tail` — real-time streaming with color-coded output
- `wrangler dev` — local dev server with live reload
- Chrome DevTools integration via `--inspector-port` [^1128^]
- QR code display for tunnel URLs [^1169^]

---

### 2.2 cloudflared — Tunnel CLI

**GitHub**: `cloudflare/cloudflared` [^1103^]  
**Language**: Go  
**Purpose**: Create secure tunnels between your infrastructure and Cloudflare edge

**Essential Commands**:
```bash
cloudflared tunnel login                    # Authenticate
cloudflared tunnel create <NAME>            # Create a tunnel
cloudflared tunnel list                     # List all tunnels
cloudflared tunnel info <NAME>              # Detailed tunnel status
cloudflared tunnel --config config.yaml run <NAME>  # Run a tunnel
cloudflared tunnel route dns my-tunnel example.com    # Route DNS
cloudflared tunnel delete <NAME>            # Delete tunnel
cloudflared tunnel cleanup <NAME>           # Force cleanup connections
cloudflared tail <UUID>                     # Livestream tunnel logs
cloudflared update                          # Self-update
cloudflared version
```

**Key Features**:
- Local and remotely-managed tunnels
- Highly available connections (multiple replicas)
- Automatic DNS route configuration
- systemd service integration [^1105^]
- Health status monitoring via `cloudflared tunnel info`

---

## 3. Cloudflare TUI/Dashboard Tools

### 3.1 Native TUI Dashboards — Status

**Current State (2025)**: Cloudflare does not offer native terminal/TUI dashboards for Analytics, Security Events, or DNS management. All dashboards are web-based. However, several workarounds exist:

**Option A: `wrangler tail` + `jq` for Real-time Log Dashboards**
```bash
# Parse and filter logs in real-time
npx wrangler tail | jq '.event.request.url'
npx wrangler tail | jq 'select(.outcome == "exception")'
npx wrangler tail --format json | jq '.logs[]'
```

**Option B: `cloudflare-cli4` for API Access to Analytics**
```bash
# Access zone analytics via CLI
cli4 /zones/:example.com/analytics/dashboard
cli4 /zones/:example.com/dnssec
cli4 /zones/:example.com/dns_records
```

**Option C: GraphQL Analytics via CLI**
```bash
# The cli4 tool supports GraphQL queries for advanced analytics
cli4 --post query='{ viewer { zones(filter:...) { httpRequests1dGroups...' }' /graphql
```

### 3.2 Third-Party Dashboards

| Tool | Type | Notes |
|------|------|-------|
| **statusflare** | Self-hosted status page ON Cloudflare | Built on Workers/D1/R2. Monitors HTTP/keyword/API/database. Meta-use case: uses Cloudflare to monitor anything. [^1285^] |

---

## 4. DNS Management CLI Tools

### 4.1 doggo — Modern DNS Client (Go)

**GitHub**: `mr-karan/doggo` [^1172^]  
**Language**: Go  
**Stars**: ~2.800+  
**Status**: Actively maintained

**Why it's great for Cloudflare users**:
- Supports DoH (DNS-over-HTTPS), DoT (DNS-over-TLS), DoQ, DNSCrypt
- Perfect for testing Cloudflare DNS (1.1.1.1, 1.1.1.2, 1.1.1.3)
- JSON output for scripting
- Color-coded tabular output
- Multiple resolver support
- Reverse DNS lookups

```bash
# Install
brew install doggo
go install github.com/mr-karan/doggo/cmd/doggo@latest

# Basic usage
doggo example.com
doggo example.com MX
doggo example.com @1.1.1.1
doggo example.com --https @https://cloudflare-dns.com/dns-query

# JSON output for scripts
doggo example.com --json

# Cloudflare DoH specifically
doggo example.com --https @https://1.1.1.1/dns-query
```

### 4.2 dog — DNS Client (Rust)

**GitHub**: `ogham/dog` [^1168^]  
**Language**: Rust  
**Stars**: ~2,700+  
**Status**: Original author archived; community fork `dog_community`/`doge` attempting to revive [^1174^]

```bash
# Install
brew install dog
cargo install dns-doge  # community fork

# Basic usage
dog example.com
dog example.com MX
dog example.com @1.1.1.1
dog example.com --https @https://dns.njal.la/dns-query

# JSON output
dog example.com --json
```

**Comparison: dog vs doggo**

| Feature | dog (Rust) | doggo (Go) |
|---------|------------|------------|
| Maintenance | Stalled, community fork | Actively maintained |
| DoH/DoT/DoQ | Yes | Yes |
| JSON output | Yes | Yes |
| Color output | Yes | Yes |
| Reverse DNS | Via PTR | Built-in |
| Installation | brew, cargo | brew, go install, scoop, winget, docker |
| **Recommendation** | Use community fork | **Preferred choice** |

### 4.3 Other DNS Tools

| Tool | Description | Cloudflare Relevance |
|------|-------------|---------------------|
| **drill** | part of ldns library, low-level DNS debugging | Good for testing DNSSEC with Cloudflare |
| **dig** | traditional BIND utility | Always available, verbose output |
| **cloudflared** | `cloudflared dig` — query Fly.io internal DNS | Specific to Fly.io [^1286^] |

---

## 5. R2 Storage TUI Tools

### 5.1 rclone — The Gold Standard (with ncdu TUI)

**Website**: rclone.org  
**GitHub**: `rclone/rclone`  
**Language**: Go  
**Status**: Mature, actively maintained

**Built-in TUI**: `rclone ncdu` provides an ncdu-style file browser for ANY cloud storage including Cloudflare R2 [^1276^]:

```bash
# Configure R2
rclone config
# > Select: Cloudflare R2 storage
# > Enter Access Key ID, Secret Key, endpoint

# TUI file browser for R2
rclone ncdu r2:my-bucket

# Other useful commands
rclone tree r2:                    # Directory tree view
rclone lsf r2:my-bucket           # List files
rclone copy ./local r2:my-bucket  # Upload
rclone sync ./local r2:my-bucket  # Sync
rclone mount r2:my-bucket /mnt/r2 # Mount as filesystem
rclone link r2:bucket/file.png    # Generate presigned URL
```

**`rclone ncdu` Key Bindings**:
- `↑/↓` or `k/j` — Navigate
- `→/l` — Enter directory
- `←/h` — Go back
- `d` — Delete file/directory
- `D` — Delete selected files
- `y` — Copy path to clipboard
- `g` — Toggle graph
- `u` — Toggle human-readable sizes
- `?` — Toggle help

**Official Cloudflare docs recommend rclone** for bulk operations [^1118^].

### 5.2 s3duck-tui — Purpose-Built TUI S3 Client

**GitHub**: `nexusriot/s3duck-tui` [^1125^]  
**Language**: Go (tview/tcell)  
**Status**: Active development

**Features**:
- Multi-profile support (create/edit/delete/clone)
- Bucket browsing with folder-style navigation
- Download support
- Bucket/object deletion
- Works with any S3-compatible storage including R2
- Built on Go's tview/tcell framework

```bash
# Install
go install github.com/nexusriot/s3duck-tui@latest

# Configure profiles with R2 credentials
# Uses S3 API endpoint: https://<account>.r2.cloudflarestorage.com
```

**Comparison: s3duck-tui vs rclone ncdu**

| Feature | s3duck-tui | rclone ncdu |
|---------|------------|-------------|
| Purpose-built TUI | Yes | Yes (subcommand) |
| Upload support | Limited | Yes |
| Download support | Yes | Yes |
| Multi-profile | Yes | Yes (via config) |
| Mount support | No | Yes |
| Sync support | No | Yes |
| Language | Go | Go |
| **Recommendation** | Simple browsing | **Full-featured choice** |

### 5.3 Wrangler for R2 (CLI, not TUI)

```bash
# Wrangler is best for single-object operations
npx wrangler r2 bucket create my-bucket
npx wrangler r2 bucket list
npx wrangler r2 object put bucket/file.txt --file ./file.txt
npx wrangler r2 object list my-bucket
```

### 5.4 AWS CLI for R2

```bash
# Any S3-compatible CLI works with R2
aws s3 ls s3://my-bucket --endpoint-url=https://<account>.r2.cloudflarestorage.com
```

---

## 6. D1 Database TUI Tools

### 6.1 sqlit-tui (sqlit) — Multi-Database TUI with D1 Support

**GitHub**: `Maxteabag/sqlit` [^969^]  
**Language**: Python  
**Status**: Active, described as "the lazygit of SQL databases"  
**Install**: `pipx install sqlit-tui`

**Cloudflare D1 Support**: Native — requires only `requests` package injection [^969^]:
```bash
pipx install sqlit-tui
pipx inject sqlit-tui requests  # for Cloudflare D1 support
```

**Features**:
- Connection manager with saved connections
- Vim-style keybindings
- Syntax highlighting
- Query history
- Fuzzy search through results
- Auto-complete for tables/columns/procedures
- Docker container auto-discovery
- SSH tunnel support
- Secure credential storage (OS keyring)
- Multiple themes (Rose Pine, Tokyo Night, Nord, Gruvbox)
- CLI mode for scripting

**Supported Databases**: PostgreSQL, MySQL, SQLite, SQL Server, MariaDB, DuckDB, CockroachDB, ClickHouse, Snowflake, Supabase, **Cloudflare D1**, Turso, Oracle, and more.

### 6.2 Wrangler D1 Commands (CLI)

```bash
npx wrangler d1 create my-db
npx wrangler d1 execute my-db --file=./schema.sql
npx wrangler d1 execute my-db --command "SELECT * FROM users"
npx wrangler d1 execute my-db --remote --file=./schema.sql
npx wrangler d1 info my-db
npx wrangler d1 delete my-db
```

### 6.3 SQLite TUI (Rust) — Local SQLite Only

**VS Code Extension**: `BuiltwithAI.sqlite-tui` [^1280^]  
**Language**: Rust  
**Status**: For local SQLite files only (not D1 remote)

---

## 7. KV Store Management

### 7.1 Wrangler KV Commands (CLI)

```bash
# Create namespace
npx wrangler kv namespace create "MY_KV"

# List namespaces
npx wrangler kv namespace list

# Key operations
npx wrangler kv key put --namespace-id=<ID> "my-key" "my-value"
npx wrangler kv key get --namespace-id=<ID> "my-key"
npx wrangler kv key delete --namespace-id=<ID> "my-key"
npx wrangler kv key list --namespace-id=<ID>

# Bulk operations
npx wrangler kv bulk put --namespace-id=<ID> ./keys.json
npx wrangler kv bulk delete --namespace-id=<ID> ./keys.json
```

### 7.2 TUI for KV

**No dedicated KV TUI exists.** The workflow is entirely CLI-based through Wrangler. For bulk operations, use JSON files with `wrangler kv bulk`.

---

## 8. Workers Debugging & Monitoring

### 8.1 wrangler tail — Real-time Log Streaming

The primary tool for monitoring Workers in the terminal [^1312^]:

```bash
npx wrangler tail                    # Stream all logs
npx wrangler tail --format pretty    # Human-readable
npx wrangler tail --format json      # JSON output
npx wrangler tail --status error     # Filter by status
```

**JSON Output Structure**:
```json
{
  "outcome": "ok",
  "exceptions": [],
  "logs": ["console.log output here"],
  "eventTimestamp": 1590680082349,
  "event": {
    "request": { "url": "https://...", "method": "GET" }
  }
}
```

### 8.2 wrangler pages deployment tail — Pages Functions Logs

```bash
npx wrangler pages deployment tail   # Stream Pages Functions logs
```

### 8.3 Chrome DevTools Integration

```bash
npx wrangler dev --inspector-port 9229
# Then open chrome://inspect in Chrome
```

### 8.4 wrangler deployments — Deployment Management

```bash
npx wrangler deployments list        # List all deployments
npx wrangler rollback <ID>           # Rollback to a deployment
npx wrangler versions upload         # Create version without deploying
```

### 8.5 Local Development

```bash
npx wrangler dev                     # Local dev with remote resources
npx wrangler dev --local             # Fully local mode
npx wrangler dev --port 8787         # Custom port
```

---

## 9. Pages Deployment Tools

### 9.1 Wrangler Pages (Official)

```bash
# Create project
npx wrangler pages project create

# Deploy (creates project if needed)
npx wrangler pages deploy <BUILD_OUTPUT_DIR>

# Preview deployments
npx wrangler pages deploy <DIR> --branch=<BRANCH>

# List deployments
npx wrangler pages deployment list

# List projects
npx wrangler pages project list
```

### 9.2 C3 (create-cloudflare) — Project Scaffolding

```bash
npm create cloudflare@latest -- my-project
npm create cloudflare@latest -- --platform=pages
npm create cloudflare@latest -- --template <github-repo>
```

**Supported Frameworks**: Next.js, Nuxt, SvelteKit, Astro, Remix, Hono, Angular, Qwik, SolidStart, Vue, React, Gatsby, Docusaurus [^1115^]

### 9.3 wrangler-action — GitHub Actions Integration

**GitHub**: `cloudflare/wrangler-action` [^1157^]  
**Current Version**: v3  
**Default Wrangler**: v4

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Features**:
- Workers deployment
- Pages deployment (production + preview)
- Secret management via `secrets` input
- Custom `preCommands` and `postCommands`
- Version upload without deploy
- GitHub Deployments integration for Pages

---

## 10. Tunnel & Load Balancer Management

### 10.1 cloudflared — Comprehensive Tunnel CLI

As documented in Section 2.2, `cloudflared` provides full tunnel lifecycle management:

```bash
# Lifecycle
cloudflared tunnel login
cloudflared tunnel create <NAME>
cloudflared tunnel list
cloudflared tunnel info <NAME>
cloudflared tunnel run <NAME>
cloudflared tunnel delete <NAME>
cloudflared tunnel cleanup <NAME>

# DNS routing
cloudflared tunnel route dns <NAME> <DOMAIN>
cloudflared tunnel route dns <NAME> '*.example.com'

# Monitoring
cloudflared tail <UUID>
cloudflared tunnel info <NAME>
cloudflared update
```

**Load Balancing Note**: Cloudflare Load Balancing does not have a dedicated CLI/TUI. It's configured via the dashboard or API (`cli4` can help here).

### 10.2 Debugging Tunnels

```bash
# Check tunnel health
cloudflared tunnel info <NAME>
cloudflared tunnel info <NAME> --connector-id <ID>

# View logs
cloudflared tail <UUID>
```

---

## 11. Edge Deployment CLIs

### 11.1 flyctl (Fly.io)

**GitHub**: `superfly/flyctl` [^1284^]  
**Language**: Go  
**Install**: `brew install flyctl` or `curl -L https://fly.io/install.sh | sh`

**Terminal-Friendly Commands**:
```bash
# App management
fly launch                    # Create and configure new app
fly deploy                    # Deploy
fly status                    # App status with regions, instances
fly status --watch            # Auto-refresh status
fly logs                      # Real-time logs
fly releases                  # Deployment history

# Monitoring
fly status --all              # Show completed instances
fly logs --json               # JSON formatted logs
fly checks list               # Health checks
fly metrics                   # Show metrics (if available)

# Debugging
fly doctor                    # Debug environment issues
fly dig <domain>              # DNS queries against Fly.io DNS

# Other useful commands
fly apps list                 # List all apps
fly machine list              # List machines (VMs)
fly machine status <ID>       # Machine status
fly volumes list              # List persistent volumes
fly secrets list              # List secrets
```

**Dashboard**: `fly dashboard` opens the web UI [^1286^].

### 11.2 Netlify CLI

**GitHub**: `netlify/cli` [^1198^]  
**Language**: Node.js  
**Requires**: Node.js 20.12.2+

```bash
npm install -g netlify-cli

# Deployment
netlify deploy                  # Deploy to draft URL
netlify deploy --prod           # Deploy to production
netlify deploy --allow-anonymous # No login required (1hr claim window)

# Sites management
netlify sites:list              # List all sites
netlify sites:create            # Create new site
netlify status                  # Project status

# Local dev
netlify dev                     # Local dev server
netlify dev --live              # With shareable tunnel

# Functions
netlify functions:list          # List functions
netlify functions:create        # Create new function
netlify functions:build         # Build functions

# Environment
netlify env:list                # List env vars
netlify env:get VAR             # Get specific var
netlify env:set VAR value       # Set env var
netlify env:clone               # Clone between sites
```

**Note**: No full TUI dashboard. Rich CLI output with tables and color formatting.

### 11.3 Vercel CLI

**Docs**: vercel.com/docs/cli [^1204^]  
**Language**: Node.js

```bash
npm install -g vercel

# Deployment
vercel                          # Deploy (default command)
vercel --prod                   # Production deploy
vercel deploy

# Monitoring
vercel list                     # List deployments
vercel list --status READY      # Filter by status
vercel list --prod              # Only production
vercel logs <deployment-url>    # Runtime logs
vercel logs <url> --follow      # Follow logs
vercel inspect <url>            # Deployment details
vercel inspect <url> --logs     # Build logs

# Management
vercel env ls                   # List env vars
vercel env pull                 # Pull to .env.local
vercel domains ls               # List domains
vercel certs ls                 # List certificates
vercel cache purge              # Purge CDN cache
```

**Note**: No TUI. Structured CLI output with `--format json` support.

---

## 12. Kubernetes/Cloud-Native TUI Tools

### 12.1 k9s — The Gold Standard

**Website**: k9scli.io [^1291^]  
**GitHub**: `derailed/k9s`  
**Language**: Go  
**Status**: Extremely popular, actively maintained

**Key Features**:
- Real-time cluster resource monitoring
- Pod logs (`l`), shell (`s`), describe (`d`), edit (`e`), restart (`r`)
- `:xray` resource graph visualization
- `:pulse` cluster overview
- Plugin system
- Custom skins and keybindings
- RBAC visualization
- Built-in HTTP benchmarking

```bash
brew install derailed/k9s/k9s
k9s                              # Launch TUI
k9s -n <namespace>               # Start in namespace
k9s -c <context>                 # Start with context
```

### 12.2 k9sight — Fast Debugging TUI

**GitHub**: `doganarif/k9sight` [^1278^]  
**Language**: Go  
**Status**: Emerging

**Features**:
- Browse deployments, statefulsets, daemonsets
- Keyboard-driven interface
- Focused on debugging workflows
- Lightweight alternative to k9s

### 12.3 buoy — Declarative Dashboard

**GitHub**: `everettraven/buoy` [^1161^]  
**Type**: Declarative K8s TUI dashboard (JSON config)

```bash
# Define dashboard in JSON, buoy fetches and displays
buoy -f dashboard.json
```

---

## 13. IaC TUI Tools

### 13.1 Terraform — No Official TUI

Terraform itself is a traditional CLI. However, several third-party TUIs exist:

| Tool | Description | Status |
|------|-------------|--------|
| **Terraform Cloud** | Web UI | Official, GUI only |
| **terratui** | Experimental TUI | Unmaintained |
| **tftui** | Terraform TUI | Community, limited |

**Note**: The ecosystem lacks a widely-adopted, actively maintained Terraform TUI comparable to k9s or lazygit.

### 13.2 Pulumi — CLI with Web Dashboard

Pulumi has an excellent web dashboard but no terminal TUI [^1135^]. Its CLI provides structured output:
```bash
pulumi up
pulumi preview
pulumi stack output
pulumi state export
```

---

## 14. Other Notable Infrastructure TUIs

| Tool | Category | Description |
|------|----------|-------------|
| **lazydocker** | Docker TUI | The "lazygit of Docker" — container management |
| **lnav** | Log viewer | Log file navigator with real-time updates, search, filtering [^1313^] |
| **ctop** | Container TUI | Top-like interface for containers |
| **bashtop/bpytop** | System monitor | Resource monitoring with beautiful TUI |
| **gping** | Network | Ping with graph plot, multiple hosts [^1123^] |

---

## 15. Complete Tool Rankings Table

| # | Tool | Category | Type | Lang | Maturity | CF-Related | Score |
|---|------|----------|------|------|----------|------------|-------|
| 1 | **wrangler** | Cloudflare CLI | CLI | TypeScript | Production | Core tool | 10/10 |
| 2 | **cloudflared** | Tunnel CLI | CLI | Go | Production | Core tool | 10/10 |
| 3 | **rclone** | Cloud storage | CLI+TUI | Go | Production | R2 support | 9/10 |
| 4 | **doggo** | DNS client | CLI | Go | Active | DoH/DoT testing | 9/10 |
| 5 | **k9s** | Kubernetes | TUI | Go | Production | Infra mgmt | 9/10 |
| 6 | **s3duck-tui** | S3/R2 storage | TUI | Go | Active | R2 compatible | 8/10 |
| 7 | **sqlit-tui** | Databases | TUI | Python | Active | D1 support | 8/10 |
| 8 | **flyctl** | Fly.io deploy | CLI | Go | Production | Edge platform | 8/10 |
| 9 | **wrangler-action** | CI/CD | GitHub Action | TypeScript | Production | Official CF | 8/10 |
| 10 | **dog** | DNS client | CLI | Rust | Stalled | DoH/DoT | 7/10 |
| 11 | **netlify-cli** | Netlify deploy | CLI | Node.js | Production | Edge platform | 7/10 |
| 12 | **vercel-cli** | Vercel deploy | CLI | Node.js | Production | Edge platform | 7/10 |
| 13 | **cloudflare-cli4** | Cloudflare API | CLI | Python | Active | Full API access | 6/10 |
| 14 | **k9sight** | Kubernetes | TUI | Go | Emerging | Infra mgmt | 6/10 |
| 15 | **buoy** | Kubernetes | TUI | Go | Emerging | Infra mgmt | 6/10 |
| 16 | **statusflare** | Status monitoring | Workers app | TypeScript | Active | Built ON CF | 5/10 |
| 17 | **dog_community** | DNS client | CLI | Rust | Emerging | DoH/DoT | 4/10 |

---

## Key Findings & Gaps

### What's Well-Covered
1. **Cloudflare has excellent CLIs**: wrangler + cloudflared cover almost all workflows
2. **R2 has great TUI support**: via rclone ncdu and s3duck-tui
3. **DNS tools are mature**: doggo is actively maintained and feature-rich
4. **D1 has TUI support**: sqlit-tui provides native D1 connectivity
5. **GitHub Actions integration is polished**: wrangler-action is mature and well-documented

### What's Missing (Opportunity for Contributors)
1. **No native Cloudflare Analytics TUI**: No tool exists to view Cloudflare Analytics, Security Events, or zone metrics in a terminal dashboard
2. **No dedicated KV Store TUI**: KV management is entirely CLI-based
3. **No Terraform/Pulumi TUI**: The IaC space lacks a k9s-equivalent TUI
4. **No Cloudflare Load Balancer CLI**: Only dashboard and API access via cli4
5. **No DDoS/security event TUI**: Security Events are dashboard-only
6. **dog DNS client needs maintenance**: Original author archived; community fork exists but is nascent

### Recommended Tool Stacks

**For Cloudflare Developers**:
```
wrangler + cloudflared + doggo + rclone + sqlit-tui
```

**For Cloud Infrastructure (General)**:
```
k9s + flyctl + rclone + lnav + lazydocker
```

**For DNS/Network Debugging**:
```
doggo + cloudflared + gping + dog (community fork)
```

---

*Report compiled from 18 independent web searches covering GitHub repositories, official documentation, terminal tool directories, and developer community sources. All citations use [^number^] format referencing search results.*
