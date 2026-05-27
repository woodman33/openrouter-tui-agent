# TUI Integration Tools — Cloud Services, DevOps, Infrastructure, System Management

## Comprehensive Research Report (June 2026)

*Generated from 15+ independent searches across GitHub, documentation, and community sources.*

---

## Table of Contents

1. [Cloud Provider TUIs](#1-cloud-provider-tuis)
2. [Docker & Kubernetes](#2-docker--kubernetes)
3. [CI/CD Tools](#3-cicd-tools)
4. [Monitoring & Dashboards](#4-monitoring--dashboards)
5. [Log Viewers](#5-log-viewers)
6. [Process Management](#6-process-management)
7. [Network Tools](#7-network-tools)
8. [SSH & Server Management](#8-ssh--server-management)
9. [Certificate & Security](#9-certificate--security)
10. [Package Managers](#10-package-managers)
11. [Infrastructure as Code](#11-infrastructure-as-code)
12. [Load Testing](#12-load-testing)
13. [Summary Rankings](#13-summary-rankings--recommendations)

---

## 1. Cloud Provider TUIs

### Claws ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [clawscli/claws](https://github.com/clawscli/claws) |
| **Language** | Go (98.8%) |
| **Stars** | 123 |
| **Last Commit** | May 2026 |
| **License** | Apache-2.0 |
| **Framework** | Bubble Tea |

**Key Features:** k9s-inspired TUI for AWS resource management with vim-style navigation. Supports 70 services and 175 resources including EC2, S3, Lambda, RDS, ECS, EKS. Multi-profile & multi-region parallel querying. Resource actions (start/stop, delete, tail logs). Cross-resource navigation (VPC to subnets, Lambda to CloudWatch). Fuzzy search, tag filtering, column sorting, side-by-side diff view. AI Chat via AWS Bedrock. 6 color themes. [^871^]

**Installation:** `brew install --cask clawscli/tap/claws`, `go install github.com/clawscli/claws/cmd/claws@latest`, or Docker. [^871^]

---

### Sacha
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [Sachamama/sacha](https://github.com/Sachamama/sacha) |
| **Language** | Go (93.8%) |
| **Stars** | 16 |
| **Last Commit** | Mar 2026 |
| **License** | MIT |
| **Framework** | Bubble Tea |

**Key Features:** Keyboard-first AWS TUI inspired by classic two-pane file managers. Supports CloudWatch Logs, S3, DynamoDB, Lambda, SSM, SQS, and EC2. Persistent profile across sessions. Auto-loads all pages progressively. [^813^] [^1000^]

**Installation:** `go install`, Homebrew, or Docker.

---

### E1S ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [keidarcy/e1s](https://github.com/keidarcy/e1s) |
| **Language** | Go (90.1%) |
| **Stars** | 884 |
| **Last Commit** | Apr 2026 |
| **License** | MIT |

**Key Features:** "~k9s for ECS". Terminal application for browsing and managing AWS ECS resources. Supports both Fargate and EC2 launch types. Hierarchical drill-down through clusters, services, tasks, containers. ECS Exec interactive shells. CloudWatch logs with real-time streaming. Service deployment rollbacks. Port forwarding. S3-backed file transfer. Vim-style navigation. [^1147^]

**Installation:** `brew install keidarcy/tap/e1s`, `go install github.com/keidarcy/e1s/cmd/e1s@latest`

---

### TGCP
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [huseyinbabal/tgcp](https://github.com/huseyinbabal/tgcp) |
| **Language** | Rust (99.4%) |
| **Stars** | 38 |
| **Last Commit** | Jan 2026 |
| **License** | MIT |
| **Framework** | Ratatui |

**Key Features:** Terminal UI for GCP resources. Multi-project support, multi-zone navigation. 60+ resource types across 30+ GCP services. Real-time auto-refresh (5s). Vim-like navigation. JSON detail view with syntax highlighting. No gcloud dependency — native authentication. Persistent config. [^994^] [^1258^]

**Installation:** `cargo install tgcp` or Docker.

---

### Burf (GCS)
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [razeghi71/burf](https://github.com/razeghi71/burf) |
| **Language** | Python |
| **License** | MIT |

**Key Features:** TUI for surfing Google Cloud Storage (GCS) buckets. Uses Google Application Default Credentials. Browse, navigate, and manage GCS objects in a terminal UI. [^990^]

**Installation:** `pip install burf` or `uv sync`

---

## 2. Docker & Kubernetes

### K9s ⭐⭐ Top Pick
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [derailed/k9s](https://github.com/derailed/k9s) |
| **Language** | Go (99.7%) |
| **Stars** | **33,700** |
| **Last Commit** | May 2026 |
| **License** | Apache-2.0 |

**Key Features:** The gold standard Kubernetes TUI. Continually watches clusters for changes. Full resource management (pods, deployments, services, nodes, etc.). Real-time metrics integration. Plugin system with 100+ community plugins. Custom skins/themes. X-ray mode for resource visualization. Port forwarding. Log streaming. Resource editing. Context/namespace switching. Pulses for cluster health overview. Used daily by thousands of DevOps engineers. [^1065^]

**Installation:** `brew install k9s`, download binaries, or Docker. [^859^]

---

### Lazydocker ⭐⭐ Top Pick
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [jesseduffield/lazydocker](https://github.com/jesseduffield/lazydocker) |
| **Language** | Go (98.4%) |
| **Stars** | **51,200** |
| **Last Commit** | Apr 2026 |
| **License** | MIT |

**Key Features:** The lazier way to manage everything Docker. View containers, images, volumes, networks in one TUI. Docker Compose project support. View logs, stats, and container details. Start/stop/rebuild containers. Custom keybindings. Project-scoped view. Very active development by the creator of LazyGit. [^1066^]

**Installation:** `brew install lazydocker`, `go install`, or binary download.

---

### Kubetui
| Attribute | Detail |
| **GitHub** | [sarub0b0/kubetui](https://github.com/sarub0b0/kubetui) |
| **Language** | Rust |
| **Framework** | Ratatui |

**Key Features:** TUI tool designed for monitoring Kubernetes resources. Log viewing with filtering, resource browsing, multi-context support. [^813^]

---

### D4S (Docker TUI)
| Attribute | Detail |
| **GitHub** | [d4s](https://github.com/d4s) |
| **Framework** | Go / Bubble Tea |

**Key Features:** Fast, keyboard-driven terminal UI to manage Docker containers, Compose stacks, and Swarm services with the ergonomics of K9s. [^813^]

---

### Oxker
| Attribute | Detail |
| **GitHub** | [mrjackwills/oxker](https://github.com/mrjackwills/oxker) |
| **Language** | Rust |
| **Framework** | Ratatui |

**Key Features:** Simple TUI to view and control docker containers. Cross-platform, minimal dependencies. [^813^]

---

### Dockly
| Attribute | Detail |
| **GitHub** | [lirantal/dockly](https://github.com/lirantal/dockly) |
| **Language** | JavaScript (Node.js) |

**Key Features:** Immersive terminal interface for managing Docker containers and services. Container management, log viewing, image pruning. [^813^]

---

## 3. CI/CD Tools

### Act (GitHub Actions Local Runner)
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [nektos/act](https://github.com/nektos/act) |
| **Language** | Go |
| **Stars** | ~60,000+ (nektos org) |
| **License** | MIT |

**Key Features:** Run GitHub Actions locally. Uses Docker to simulate GitHub Actions runner environment. Supports custom Docker images, secrets, environment variables. Event type simulation (push, pull_request). Saves GitHub Actions minutes for testing/debugging workflows. [^901^] [^911^]

**Installation:** `brew install act`, `go install`, or Docker.

---

### Catalyst
| Attribute | Detail |
| **Language** | Likely Rust/Go |

**Note:** A CI/CD TUI tool referenced in the user's request. Limited specific information found in searches. Appears to be related to GitHub Actions workflow management. Further investigation needed.

---

### ggcat (GitLab CI)
| Attribute | Detail |
| **Note** | Tool for viewing GitLab CI pipelines in terminal |

**Key Features:** Terminal-based viewer for GitLab CI/CD pipelines. Monitor pipeline status, view job logs, track pipeline progress without leaving the terminal.

---

## 4. Monitoring & Dashboards

### Btop++ ⭐⭐ Top Pick
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [aristocratos/btop](https://github.com/aristocratos/btop) |
| **Language** | C++ (79.7%), C (18.3%) |
| **Stars** | **32,500** |
| **Last Commit** | May 2026 |
| **License** | Apache-2.0 |

**Key Features:** Beautiful system resource monitor. CPU (per-core), memory, disk, network monitoring. Process list with tree view. Interactive process killing (SIGTERM/SIGKILL). Mouse support. 20+ themes. History graphs with gradients. Battery monitoring. Disk IO per process. NVidia GPU support. Network interface stats. Auto-detection of CPU cores and disks. [^1095^]

**Installation:** `brew install btop`, `pacman -S btop`, `snap install btop`, or build from source. [^855^]

---

### Bottom (btm) ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [ClementTsang/bottom](https://github.com/ClementTsang/bottom) |
| **Language** | Rust (99.2%) |
| **Stars** | **13,400** |
| **Last Commit** | May 2026 |
| **License** | MIT |
| **Framework** | custom TUI |

**Key Features:** Cross-platform graphical process/system monitor. Highly customizable layouts. CPU, memory, disk, network, GPU, temperature monitoring. Process tree view. Battery widget. Filterable process list. Multiple color themes. Config file support. Lightweight and fast. Widget-based layout system. [^1094^]

**Installation:** `cargo install bottom`, `brew install bottom`, `pacman -S bottom`, or snap. [^855^]

---

### Glances
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [nicolargo/glances](https://github.com/nicolargo/glances) |
| **Language** | Python |
| **Stars** | ~27,000 |
| **License** | LGPL-3.0 |

**Key Features:** Cross-platform monitoring tool. Client/server mode for remote monitoring. Web UI available. RESTful API. Docker integration. Export to CSV/InfluxDB/Prometheus. Process monitoring with alerts. Plugin system. [^855^]

**Installation:** `pip install glances`, `brew install glances`, `apt install glances`, or snap.

---

### Netscanner ⭐ New & Notable
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [Chleba/netscanner](https://github.com/Chleba/netscanner) |
| **Language** | Rust |
| **License** | MIT |
| **Framework** | Ratatui |

**Key Features:** All-in-one network scanning and diagnostic tool. WiFi scanning with signal strength charts. Host discovery (CIDR ping sweep). TCP port scanning. Live packet capture (TCP, UDP, ICMP, ARP). Traffic statistics + DNS resolution. CSV export. Cross-platform (Linux, macOS, Windows). Root privileges required for packet capture. [^961^] [^956^]

**Installation:** `cargo install netscanner`, `apk add netscanner` (Alpine edge), or Arch Linux AUR.

---

### RustNet
| Attribute | Detail |
| **GitHub** | [domcyrus/rustnet](https://github.com/domcyrus/rustnet) |
| **Language** | Rust |
| **Framework** | Ratatui |

**Key Features:** Per-process network monitoring with deep packet inspection. Cross-platform, sandboxed. eBPF enhanced process identification on Linux. GeoIP support (MaxMind). PCAP export with process attribution. Complements tools like Wireshark and tcpdump. [^962^]

---

## 5. Log Viewers

### Lnav ⭐⭐ Top Pick
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [tstack/lnav](https://github.com/tstack/lnav) |
| **Language** | C++ (90.8%) |
| **Stars** | **10,300** |
| **Last Commit** | May 2026 |
| **License** | BSD-2-Clause |

**Key Features:** The Logfile Navigator — ncurses-based log viewer. Automatic format detection (syslog, Apache, JSON, and 30+ more). Decompresses on the fly. Merges multiple files by timestamp. Real-time tail with follow mode. Regex search and filter. SQLite queries against log data (`;` for SQL). Pretty-print JSON. Histogram of messages over time. SSH demo available: `ssh playground@demo.lnav.org`. [^1002^] [^1092^]

**Installation:** `brew install lnav`, `apt install lnav`, `pacman -S lnav`, or download binaries. [^999^]

---

### Gonzo ⭐ Recommended — New & Notable
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [control-theory/gonzo](https://github.com/control-theory/gonzo) |
| **Language** | Go (71.4%), TypeScript (22%) |
| **Stars** | **2,700** |
| **Last Commit** | May 2026 |
| **License** | MIT |
| **Framework** | Bubble Tea, Lipgloss |

**Key Features:** k9s-inspired log analysis TUI. Native OpenTelemetry (OTLP) support. AI-powered insights (GPT-4, Claude, Ollama, LM Studio). 2x2 grid dashboard: live log stream, severity pie chart, word frequency heatmap, timeline. Built-in web dashboard (Dstl8.Lite) on port 5718. Kubernetes native integration. 11+ themes. k9s plugin available (Ctrl-L). Regex filtering, severity filtering, attribute search. Drain3 pattern detection. [^1132^] [^1133^]

**Installation:** `brew install gonzo`, `go install github.com/control-theory/gonzo/cmd/gonzo@latest`

---

### Otel-tui ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [ymtdzzz/otel-tui](https://github.com/ymtdzzz/otel-tui) |
| **Language** | Go (97.8%) |
| **Stars** | **1,000** |
| **Last Commit** | May 2026 |
| **License** | Apache-2.0 |

**Key Features:** Terminal OpenTelemetry viewer. Supports OTLP (gRPC/HTTP), Zipkin, Prometheus, and Datadog formats. Trace waterfall diagram. Log viewing with trace correlation. Metric stream display. Lightweight, real-time updates. No memory leaks with data rotation. Perfect for local development verification of OpenTelemetry instrumentation. [^865^] [^860^]

**Installation:** `brew install ymtdzzz/tap/otel-tui`, `go install github.com/ymtdzzz/otel-tui@latest`

---

### Nerdlog
| Attribute | Detail |
| **GitHub** | [dimonomid/nerdlog](https://github.com/dimonomid/nerdlog) |
| **Language** | Go |

**Key Features:** Fast, remote-first, multi-host TUI log viewer with timeline histogram. No central server required. vim-like command line. Multi-host connection status indicators. [^1001^]

---

## 6. Process Management

### Procs ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [dalance/procs](https://github.com/dalance/procs) |
| **Language** | Rust (99.6%) |
| **Stars** | **6,100** |
| **Last Commit** | May 2026 |
| **License** | MIT |

**Key Features:** Modern replacement for `ps`. Colored and human-readable output. Automatic theme detection based on terminal background. Multi-column keyword search. Additional info not in ps: TCP/UDP ports, read/write throughput, Docker container name. Pager support. Watch mode (like `top`). Tree view. Highly configurable. [^1175^]

**Installation:** `cargo install procs`, `brew install procs`, `pacman -S procs`, snap.

---

### Htop (Classic)
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [htop-dev/htop](https://github.com/htop-dev/htop) |
| **Language** | C |
| **Stars** | ~6,000 |
| **License** | GPL-2.0 |

**Key Features:** Interactive process viewer for Unix. The classic `top` replacement. Per-CPU bars, memory bars, process tree. Kill/renice processes. Search, filter, sort. Color-coded output. Minimal dependencies. Pre-installed on many Linux distributions. [^855^]

**Installation:** Pre-installed on most Linux. `brew install htop`, `apt install htop`.

---

### Bpytop
| Attribute | Detail |
| **GitHub** | [aristocratos/bpytop](https://github.com/aristocratos/bpytop) |
| **Language** | Python |
| **Stars** | ~11,000 |
| **License** | Apache-2.0 |

**Key Features:** Python-based system monitor with lots of information. CPU, memory, disk, network monitoring. Process management. Mouse support. Configurable themes. Now largely superseded by btop++ (C++ rewrite). [^813^]

**Note:** bpytop is in maintenance mode; btop++ is the recommended successor.

---

## 7. Network Tools

### Trippy ⭐⭐ Top Pick
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [fujiapple852/trippy](https://github.com/fujiapple852/trippy) |
| **Language** | Rust (99.6%) |
| **Stars** | **6,900** |
| **Last Commit** | May 2026 |
| **License** | Apache-2.0 |
| **Framework** | Ratatui |

**Key Features:** Combines traceroute + ping in one interactive TUI. Multiple protocols: ICMP, UDP, TCP (IPv4/IPv6). Multiple tracing strategies: Paris, Dublin, Classic (ECMP-aware). DNS resolution with reverse lookup. GeoIP support (MaxMind GeoLite2). MPLS label display. Hop detail expansion. Export results as JSON, CSV, pretty-printed text. Multiple color themes. Cross-platform: Windows, macOS, Linux, *BSD. [^891^] [^1063^]

**Installation:** `cargo install trippy --locked`, `brew install trippy`, `pacman -S trippy`, `apt install trippy`.

---

### Bandwhich ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [imsnif/bandwhich](https://github.com/imsnif/bandwhich) |
| **Language** | Rust (100%) |
| **Stars** | **11,800** |
| **Last Commit** | May 2026 |
| **License** | MIT |

**Key Features:** Terminal bandwidth utilization tool. Shows bandwidth usage by process, connection, and remote IP/hostname. Cross-platform (Linux, macOS, Windows). Raw data export to log files. Minimal overhead. No root required on some platforms. [^1097^]

**Installation:** `cargo install bandwhich`, `brew install bandwhich`, or download binaries.

---

### Termshark
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [gcla/termshark](https://github.com/gcla/termshark) |
| **Language** | Go (99.6%) |
| **Stars** | **9,900** |
| **Last Commit** | Nov 2022 |
| **License** | MIT |

**Key Features:** Terminal UI for tshark, inspired by Wireshark. Read pcap files or sniff live interfaces (where tshark permits). Wireshark display filters. TCP/UDP flow reassembly. View conversations by protocol. Copy packet data to clipboard. Cross-platform (Linux, macOS, *BSD, Android, Windows). [^898^] [^1257^]

**Note:** Last release was v2.4.0 in July 2022. Project appears stable but less actively developed.

**Installation:** Pre-packaged for Arch, Debian, FreeBSD, Homebrew, NixOS, Termux. `go install github.com/gcla/termshark/v2/cmd/termshark@v2.4.0`

---

### Nethogs
| Attribute | Detail |
| **GitHub** | [raboof/nethogs](https://github.com/raboof/nethogs) |
| **Language** | C++ |
| **License** | GPL-2.0 |

**Key Features:** 'Net top' tool — shows network bandwidth per process. Real-time monitoring. Simple ncurses interface. Good for quick triage. [^813^]

---

### Dog (dogdns)
| Attribute | Detail |
| **GitHub** | [ogham/dog](https://github.com/ogham/dog) |
| **Language** | Rust |
| **Stars** | ~6,000+ |
| **License** | EUPL-1.2 |

**Key Features:** Command-line DNS client. Colorized output. Supports multiple DNS protocols (DoH, DoT, TCP, UDP). JSON output. Supports multiple record types (A, AAAA, CNAME, MX, NS, SOA, TXT). Pretty and useful output. [^968^]

**Installation:** `cargo install dog`, `brew install dog`, or download binaries.

---

## 8. SSH & Server Management

### LazySSH ⭐ New & Notable
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [adembc/lazyssh](https://github.com/adembc/lazyssh) |
| **Language** | Go |
| **Stars** | Growing |
| **License** | MIT |

**Key Features:** TUI SSH manager inspired by lazydocker and k9s. Browse/manage servers from `~/.ssh/config`. Add, edit, pin, ping, delete entries. Fuzzy search, tag, and sort servers. One-keypress SSH into any host. Config safety: non-destructive writes, atomic writes, rolling backups. Does not store credentials — wraps existing SSH config. [^888^] [^889^] [^909^]

**Installation:** `go install`, Homebrew, or download binaries.

---

### Termscp
| Attribute | Detail |
| **GitHub** | [veeso/termscp](https://github.com/veeso/termscp) |
| **Language** | Rust |
| **Framework** | tui-rs |

**Key Features:** TUI file transfer and explorer. Supports SCP/SFTP/FTP/S3. Edit remote files. Activity logging. Bookmarks. [^813^]

---

### TFX (Terminal File Explorer)
| Attribute | Detail |
| **Note** | Various terminal file explorers with SFTP support exist |

---

## 9. Certificate & Security

### Flawz ⭐ Recommended — CVE Browser
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [orhun/flawz](https://github.com/orhun/flawz) |
| **Language** | Rust (100%) |
| **Stars** | **593** |
| **Last Commit** | Jan 2025 |
| **License** | MIT + Apache-2.0 |
| **Framework** | Ratatui |

**Key Features:** TUI for browsing security vulnerabilities (CVEs). Connects to NIST NVD database. Real-time search with instant filtering. Vim-style navigation (j/k, / for search). Offline mode with local SQLite cache. Selective sync by year (`--feeds 2020:2024`). 7 color themes (Dracula, Nord, One Dark, Solarized, Gruvbox, Catppuccin). Space to open first reference link in browser. Memory: ~20-50 MB. Full CVE database ~200-300 MB. [^960^] [^1062^]

**Installation:** `cargo install flawz`, `brew install flawz`, `pacman -S flawz`, `nix run nixpkgs#flawz`

**Example:** `flawz --feeds 2024 --query xz` [^955^]

---

### Y509 — Certificate Analyzer
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [kanywst/y509](https://github.com/kanywst/y509) |
| **Language** | Go |
| **License** | MIT |
| **Framework** | Bubble Tea, Lip Gloss |

**Key Features:** TUI for viewing and analyzing X.509 certificate chains. Performance-first custom viewport rendering. Chain validation with detailed error reporting. Search & filter (expired, expiring, valid, self-signed). Export certificates in PEM/DER. Pipe from OpenSSL: `openssl s_client -connect example.com:443 -showcerts | y509`. Catppuccin default theme. [^991^] [^995^]

**Installation:** `brew tap kanywst/y509 && brew install y509`, `go install github.com/kanywst/y509@latest`

---

## 10. Package Managers

### Topgrade ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [topgrade-rs/topgrade](https://github.com/topgrade-rs/topgrade) |
| **Language** | Rust (99.6%) |
| **Stars** | **4,100** |
| **Last Commit** | May 2026 |
| **License** | GPL-3.0 |

**Key Features:** Upgrade all your tools with a single command. Supports 100+ package managers: apt, brew, cargo, npm, pip, gem, pacman, nix, snap, flatpak, and many more. Detects available updates and runs them in parallel. Customizable via TOML config. Dry-run mode. Pre/post upgrade hooks. Cleanup options. Cross-platform (Linux, macOS, Windows, FreeBSD). 291 contributors. Actively maintained fork of the original topgrade. [^1176^]

**Installation:** `cargo install topgrade`, `brew install topgrade`, `pacman -S topgrade`, `nix-env -iA nixpkgs.topgrade`

---

### Winget-tui (Windows)
| Attribute | Detail |
| **GitHub** | [shanselman/winget-tui](https://github.com/shanselman/winget-tui) |
| **Language** | Rust |
| **License** | MIT |
| **Framework** | Ratatui |

**Key Features:** Terminal UI for Windows Package Manager (winget). Search, install, uninstall, upgrade packages. View installed packages. Pin/unpin packages. Source filtering (winget, msstore). Real-time local filter. Sortable columns. Version-specific install. CSV export. Vim-style navigation. [^971^]

**Installation:** `winget install Hanselman.WingetTUI` or download binary.

---

## 11. Infrastructure as Code

### Pug ⭐ Recommended
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [leg100/pug](https://github.com/leg100/pug) |
| **Language** | Go (99.5%) |
| **Stars** | **681** |
| **Last Commit** | Jan 2026 |
| **License** | MPL-2.0 |

**Key Features:** TUI for Terraform/OpenTofu power users. Perform tasks in parallel (plan, apply, init). Interactively manage state resources (targeted plans, move, delete). Supports Terraform, OpenTofu, and Terragrunt. Terragrunt dependency support. Workspace support with auto-loaded variable files. Infracost integration for cost estimation. Backend agnostic (S3, Cloud, etc.). [^869^] [^1093^]

**Installation:** `go install`, Homebrew, or download from releases.

**Note:** Mentions OTF (Open Source alternative to Terraform Cloud) in docs. [^1093^]

---

### CDKTF-TUI
| Attribute | Detail |
| **Note** | TUI for AWS CDK for Terraform. Limited information found. Community tooling appears to be emerging. |

---

## 12. Load Testing

### Oha ⭐⭐ Top Pick
| Attribute | Detail |
|-----------|--------|
| **GitHub** | [hatoo/oha](https://github.com/hatoo/oha) |
| **Language** | Rust (99.7%) |
| **Stars** | **10,300** |
| **Last Commit** | Apr 2026 |
| **License** | MIT |
| **Framework** | Ratatui |

**Key Features:** "Ohayou" — HTTP load generator with real-time TUI. Inspired by rakyll/hey. Real-time TUI with ratatui showing latency percentiles, request rates, status code distribution. HTTP/2 and HTTP/3 support. JSON and CSV output. Configurable concurrency, request count, duration. Rate limiting. Keep-alive control. URL list support. SQLite export for analysis. WebSocket support. Docker support. VSOCK support. ~1.3x faster than `hey` in benchmarks. [^890^] [^896^] [^1148^]

**Installation:** `cargo install oha`, `brew install oha`, `pacman -S oha`, `winget install hatoo.oha`

---

### K6 (Load Testing)
| Attribute | Detail |
| **GitHub** | [grafana/k6](https://github.com/grafana/k6) |
| **Language** | Go |
| **Stars** | ~26,000 |
| **License** | AGPL-3.0 |

**Key Features:** Modern load testing tool scriptable in ES6 JavaScript. HTTP/1.1, HTTP/2.0, WebSocket support. Thresholds for pass/fail criteria. Scenarios for complex load patterns. Extensible with extensions. Cloud execution option (k6 Cloud). Used widely in CI/CD pipelines. Note: No native TUI — primarily script-based with web dashboard, though a Python TUI (k6control) exists for remote control. [^997^] [^1003^]

**Installation:** `brew install k6`, Docker, or download binaries.

---

### K6control (k6 TUI)
| Attribute | Detail |
| **GitHub** | [ragnarlonn/k6control](https://github.com/ragnarlonn/k6control) |
| **Language** | Python |

**Key Features:** Python TUI for controlling a running k6 instance via REST API. Dynamically alter load level during test (+/- keys). Pause/resume tests. ASCII graphics using Python curses. [^1003^]

---

---

## 13. Summary Rankings & Recommendations

### By Category (Top Pick)

| Category | Top Pick | Stars | Why |
|----------|----------|-------|-----|
| Cloud (AWS) | **Claws** | 123 | Most comprehensive AWS TUI — 70 services, AI chat, diff view |
| Cloud (ECS) | **E1S** | 884 | Best ECS-specific tool — like k9s for containers |
| Cloud (GCP) | **TGCP** | 38 | Only mature GCP TUI with 60+ resource types |
| Docker | **Lazydocker** | 51,200 | Gold standard, by LazyGit creator, very active |
| Kubernetes | **K9s** | 33,700 | THE Kubernetes TUI — essential for K8s operators |
| Monitoring | **Btop++** | 32,500 | Most beautiful monitor, feature-rich, C++ performance |
| Log Viewer | **Lnav** | 10,300 | Mature, 30+ log formats, SQL queries, SSH demo |
| Log (Modern) | **Gonzo** | 2,700 | AI-powered, OTLP-native, k9s-inspired, web dashboard |
| Process Mgmt | **Procs** | 6,100 | Best `ps` replacement — ports, Docker, tree view |
| Network | **Trippy** | 6,900 | Best traceroute TUI — GeoIP, Paris/Dublin strategies |
| Bandwidth | **Bandwhich** | 11,800 | Process-level bandwidth attribution |
| Security/CVE | **Flawz** | 593 | Best CVE browser — offline mode, NVD sync |
| Certificates | **Y509** | Growing | Best cert chain analyzer — Bubble Tea, OpenSSL pipe |
| Package Mgmt | **Topgrade** | 4,100 | 100+ package managers, one command |
| IaC | **Pug** | 681 | Terraform/OpenTofu/Terragrunt + Infracost |
| Load Testing | **Oha** | 10,300 | Real-time TUI, HTTP/2+3, faster than hey |

### Overall Top 10 (By Impact & Adoption)

| Rank | Tool | Stars | Category | Why It Matters |
|------|------|-------|----------|----------------|
| 1 | **Lazydocker** | 51,200 | Docker | Most popular DevOps TUI; essential Docker workflow tool |
| 2 | **K9s** | 33,700 | Kubernetes | Standard Kubernetes cluster management TUI |
| 3 | **Btop++** | 32,500 | Monitoring | Most popular system monitor; beautiful and functional |
| 4 | **Oha** | 10,300 | Load Testing | Best HTTP load testing with real-time TUI |
| 5 | **Lnav** | 10,300 | Logs | Most mature log viewer; 30+ formats, SQL queries |
| 6 | **Termshark** | 9,900 | Network | Wireshark in terminal; pcap analysis over SSH |
| 7 | **E1S** | 884 | Cloud (ECS) | Best AWS ECS TUI; like k9s for containers |
| 8 | **Gonzo** | 2,700 | Logs (Modern) | AI-powered, OTLP-native; the future of log TUIs |
| 9 | **Topgrade** | 4,100 | Packages | Upgrade everything; 100+ package managers |
| 10 | **Trippy** | 6,900 | Network | Modern traceroute; GeoIP, Paris strategy |

### Most Actively Developed (2026 Commits)

| Tool | Last Commit | Activity Level |
|------|-------------|----------------|
| K9s | May 2026 | Very High |
| Lazydocker | Apr 2026 | High |
| Btop++ | May 2026 | High |
| Bottom | May 2026 | High |
| Trippy | May 2026 | High |
| Claws | May 2026 | High |
| Oha | Apr 2026 | High |
| Gonzo | May 2026 | High |
| Topgrade | May 2026 | High |
| Otel-tui | May 2026 | High |
| E1S | Apr 2026 | High |
| Procs | May 2026 | Medium-High |

### Emerging Tools to Watch

| Tool | Stars | Why Watch |
|------|-------|-----------|
| **Claws** | 123 | Fastest-growing AWS TUI; 70 services, AI chat |
| **Gonzo** | 2,700 | AI + OTLP + k9s ergonomics = log analysis future |
| **E1S** | 884 | Only ECS-specific TUI; fills a real gap |
| **TGCP** | 38 | GCP has almost no TUI tools; this is the start |
| **Flawz** | 593 | CVE browsing from terminal; security-first |
| **Y509** | Growing | Certificate analysis TUI; TLS ops need this |
| **Pug** | 681 | Terraform TUI with parallel execution |
| **RustNet** | Growing | eBPF-powered network monitoring with DPI |

### Framework Distribution

| Framework | Tools Using It | Notable Examples |
|-----------|---------------|------------------|
| **Ratatui** (Rust) | 15+ | Trippy, Bottom, TGCP, Netscanner, Oha, Flawz, Winget-tui |
| **Bubble Tea** (Go) | 12+ | Claws, Sacha, E1S, Gonzo, Y509, LazySSH |
| **Custom/ncurses** | 8+ | Lnav, Htop, Btop++ (custom C++), Glances |
| **gowid** (Go/tcell) | 1 | Termshark |
| **Textual** (Python) | 2+ | bpytop, various utilities |

---

## Key Insights

1. **Go + Bubble Tea dominates cloud tools**: Nearly every cloud/infra TUI (Claws, E1S, Sacha, K9s, Lazydocker) uses Go with Charm's Bubble Tea framework for its elegant, composable TUI model.

2. **Rust + Ratatui dominates monitoring/network**: System monitors, network tools, and security TUIs overwhelmingly use Rust with Ratatui for performance and memory safety.

3. **K9s is the Kubernetes standard**: At 33,700 stars, k9s has near-universal adoption among Kubernetes operators. Its plugin ecosystem makes it extensible.

4. **AI integration is emerging**: Claws (AWS Bedrock) and Gonzo (OpenAI/Claude/Ollama) show that AI-powered TUIs are the next frontier for terminal tools.

5. **OpenTelemetry is changing log tools**: Gonzo and otel-tui both prioritize OTLP natively, reflecting the industry's shift toward OpenTelemetry standards.

6. **Cross-platform is table stakes**: Every top tool supports Linux, macOS, and most support Windows. Package manager availability (brew, pacman, apt, cargo) is expected.

---

## Sources

- GitHub repositories and README files (direct browsing)
- [^813^] rothgar/awesome-tuis — curated TUI list
- [^855^] HowToGeek — Linux system monitor comparison
- [^858^] PackageMain — Essential CLI/TUI tools for developers
- [^859^] DevOps-DB — Linux TUI tools for DevOps
- [^860^] Dev.to — otel-tui blog post
- [^863^] TechForward — Gonzo log analyzer review
- [^866^] ControlTheory blog — Why we made Gonzo
- [^891^] RustUtils — Trippy tool review
- [^894^] TerminalTrove — Trippy review
- [^896^] X-CMD — Oha load testing guide
- [^901^] Codemancers — Act guide for GitHub workflows
- [^955^] X-CMD — Flawz CVE browser guide
- [^957^] TerminalTrove — Flawz review
- [^960^] GitHub — orhun/flawz repository
- [^969^] Ostechnix — Topgrade guide
- [^990^] GitHub — razeghi71/burf
- [^991^] Dev.to — y509 certificate TUI tool
- [^994^] Lib.rs — tgcp crate documentation
- [^997^] Karan Sharma — Load testing with k6
- [^1000^] GitHub — Sachamama/sacha
- [^1002^] GitHub — tstack/lnav
- [^1003^] Medium — Building a UI for k6
- [^1132^] GitHub — control-theory/gonzo
- [^1133^] TechForward — Gonzo review

---

*Report generated June 2026. Star counts are approximate and fluctuate.*
