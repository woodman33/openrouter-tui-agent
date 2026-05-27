# ASCII Art, Terminal Graphics & Visual TUI Tools - Comprehensive Research Report

> **Research Date**: 2025 | **Searches Performed**: 15+ independent queries across GitHub, web search, and direct repository inspection

---

## Table of Contents

1. [Image-to-ASCII Converters](#1-image-to-ascii-converters)
2. [ASCII Art Generators](#2-ascii-art-generators)
3. [Animated ASCII / Terminal Screensavers](#3-animated-ascii--terminal-screensavers)
4. [Terminal Image Viewers](#4-terminal-image-viewers)
5. [GIF-to-ASCII Converters](#5-gif-to-ascii-converters)
6. [Color & Style Effects](#6-color--style-effects)
7. [Charts & Plotting in Terminal](#7-charts--plotting-in-terminal)
8. [Maps in Terminal](#8-maps-in-terminal)
9. [Diagrams in Terminal](#9-diagrams-in-terminal)
10. [Drawing Tools](#10-drawing-tools)
11. [Font & Typography / Presentations](#11-font--typography--presentations)
12. [Progress Bars & Spinners](#12-progress-bars--spinners)
13. [Ranked Recommendations](#13-ranked-recommendations)

---

## 1. Image-to-ASCII Converters

### 1.1 Chafa (Top Pick)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [hpjansson/chafa](https://github.com/hpjansson/chafa) |
| **Stars** | 4.9k |
| **Language** | C (92.3%) |
| **License** | LGPL-3.0 / GPL-3.0 |
| **Last Commit** | Apr 2026 (very active) |
| **Description** | The premier terminal graphics toolkit for the 21st century |

**Key Features:**
- Converts images and animated GIFs to ANSI/Unicode character art
- Outputs to all major terminal graphics formats: Sixels, Kitty, iTerm2, Unicode mosaics
- Combines Unicode symbols from multiple selectable ranges for optimal output
- Fullwidth character support (CJK)
- Glyphs can be loaded from any font file (TTF, OTF, PCF via FreeType)
- Multiple color modes: Truecolor, 256-color, 16-color, simple FG/BG
- Alpha transparency support in any color mode, including animations
- SIMD optimized, multithreaded, fast & lean
- Stable C API for library use
- Python bindings available

**Installation:**
```bash
# Ubuntu/Debian
sudo apt install chafa
# macOS
brew install chafa
# Arch
sudo pacman -S chafa
# From source
./autogen.sh && make && sudo make install
```

**Example Usage:**
```bash
chafa image.jpg                    # Basic conversion
chafa --symbols vhalf image.jpg    # Use only half blocks
chafa -c 256 --dither ordered image.gif   # 256-color with dithering
chafa -f kitty image.png           # Kitty graphics protocol
curl https://example.com/img.jpg | chafa -
```

**Why it's the best:** Chafa is the most feature-complete and actively maintained terminal graphics tool. Its broad format support, multiple output protocols, and excellent performance make it the gold standard. [^1^]

---

### 1.2 ASCII Image Converter
| Attribute | Details |
|-----------|---------|
| **GitHub** | [TheZoraiz/ascii-image-converter](https://github.com/TheZoraiz/ascii-image-converter) |
| **Stars** | 3.3k |
| **Language** | Go (100%) |
| **License** | Apache-2.0 |
| **Last Commit** | Nov 2022 |

**Key Features:**
- Cross-platform (Windows, Linux, macOS)
- Supports Braille art output
- Input formats: JPEG, PNG, BMP, WEBP, TIFF, GIF
- URL support (fetch images from web)
- Color support (8-bit, 24-bit truecolor)
- Save output as images
- Binary piping support

**Installation:**
```bash
go install github.com/TheZoraiz/ascii-image-converter@latest
# Or download pre-built binaries from releases
```

**Example Usage:**
```bash
ascii-image-converter image.jpg
ascii-image-converter --braille image.png
ascii-image-converter --color https://example.com/img.jpg
```

---

### 1.3 Viu
| Attribute | Details |
|-----------|---------|
| **GitHub** | [atanunq/viu](https://github.com/atanunq/viu) |
| **Stars** | 3.2k |
| **Language** | Rust (100%) |
| **License** | MIT |
| **Last Commit** | Dec 2025 |

**Key Features:**
- Native iTerm and Kitty graphics protocol support
- Falls back to Unicode half-blocks for standard terminals
- Truecolor (24-bit) and ANSI 256-color support
- Animated GIF support
- Pipe input from stdin
- Custom dimensions
- Transparency support
- Experimental Sixel support

**Installation:**
```bash
cargo install viu
# macOS
brew install viu
# Arch Linux
pacman -S viu
```

**Example Usage:**
```bash
viu image.png
viu -w 60 image.jpg       # Width 60 columns
viu -t image.gif           # With transparency
cat image.png | viu -
viu ~/Pictures/            # Browse directory
```

---

### 1.4 Timg
| Attribute | Details |
|-----------|---------|
| **GitHub** | [hzeller/timg](https://github.com/hzeller/timg) |
| **Stars** | 2.6k |
| **Language** | C++ (94.1%) |
| **License** | GPL-2.0 |
| **Last Commit** | Sep 2025 |

**Key Features:**
- Terminal image AND video viewer
- Sixel, Kitty, iTerm2 graphics protocol support
- 24-Bit color Unicode block fallback
- Grid display mode (contact sheet)
- Animated GIF and video playback
- Scroll static images as banner
- URL support (image URLs)
- fzf integration for image preview

**Installation:**
```bash
# Ubuntu/Debian (build from source)
sudo apt install cmake g++ pkg-config
sudo apt install libgraphicsmagick++-dev libturbojpeg-dev
sudo apt install libsixel-dev libavcodec-dev libavformat-dev
git clone https://github.com/hzeller/timg.git && cd timg
mkdir build && cd build && cmake .. && make
# macOS
brew install timg
```

**Example Usage:**
```bash
timg some-image.jpg
timg --grid=3x2 *.jpg        # Grid display
timg some-video.mp4          # Play video
timg --scroll some-image.jpg # Scroll as banner
timg -g80x40 image.jpg > /tmp/imageout.txt  # Save output
```

---

### 1.5 TIV (TerminalImageViewer)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [stefanhaustein/TerminalImageViewer](https://github.com/stefanhaustein/TerminalImageViewer) |
| **Stars** | ~700 (estimated) |
| **Language** | C++ |
| **License** | Apache-2.0 |
| **Last Commit** | Active |

**Key Features:**
- Displays images using RGB ANSI codes and Unicode graphic blocks
- 256-color palette mode (-256 flag)
- 24-bit truecolor output
- ImageMagick dependency for format support

**Installation:**
```bash
brew install terminalimageviewer    # macOS
# Or build from source
git clone https://github.com/stefanhaustein/TerminalImageViewer.git
cd TerminalImageViewer/src && make && sudo make install
```

---

### 1.6 Catimg
| Attribute | Details |
|-----------|---------|
| **GitHub** | [posva/catimg](https://github.com/posva/catimg) |
| **Stars** | ~500 (estimated) |
| **Language** | C |
| **License** | MIT |
| **Last Commit** | Stable |

**Key Features:**
- Renders images using only Unicode characters
- No dependencies
- Works over SSH
- Animated GIF playback with configurable loops

**Installation:**
```bash
brew install catimg    # macOS
git clone https://github.com/posva/catimg.git
cd catimg && cmake . && sudo make install
```

**Example Usage:**
```bash
catimg image.png
catimg -w 80 image.jpg    # Custom width
catimg -r 2 image.png     # Double resolution
```

---

### 1.7 img2txt (libcaca)
| Attribute | Details |
|-----------|---------|
| **Package** | `caca-utils` |
| **Language** | C |
| **License** | WTFPL |

**Key Features:**
- Converts images to colour ASCII characters
- Multiple output formats: ANSI, HTML, SVG, IRC, BBCode
- Configurable dithering algorithms (Floyd-Steinberg, ordered, etc.)
- Brightness, contrast, gamma adjustment

**Installation:**
```bash
sudo apt install caca-utils    # Debian/Ubuntu
```

**Example Usage:**
```bash
img2txt image.png
img2txt -W 100 -f ansi image.jpg
img2txt -d fstein -c 2.0 image.gif
```

---

## 2. ASCII Art Generators

### 2.1 Figlet (The Classic)
| Attribute | Details |
|-----------|---------|
| **Website** | [figlet.org](http://www.figlet.org/) |
| **Language** | C |
| **License** | BSD-like |

**Key Features:**
- The original ASCII banner generator (since 1991)
- 200+ font styles available (Standard, Slant, Block, Bubble, Digital, etc.)
- Wide collection at [xero/figlet-fonts](https://github.com/xero/figlet-fonts)
- Simple, fast, universally available

**Installation:**
```bash
sudo apt install figlet        # Debian/Ubuntu
brew install figlet            # macOS
sudo pacman -S figlet          # Arch
```

**Example Usage:**
```bash
figlet "Hello World"
figlet -f slant "Hello"
figlet -c "Centered"           # Centered
echo "Hello" | figlet
```

---

### 2.2 Toilet (The Other Implementation)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [cacalabs/toilet](https://github.com/cacalabs/toilet) |
| **Stars** | 300 |
| **Language** | C (72.7%) |
| **License** | WTFPL |
| **Last Commit** | Stable |

**Key Features:**
- Enhanced version of figlet
- Supports FIGlet and TOIlet font files (.flf, .tlf)
- Built-in color filters (--gay, --metal, etc.)
- Unicode support
- Filters for visual effects

**Installation:**
```bash
sudo apt install toilet        # Debian/Ubuntu
brew install toilet            # macOS
```

**Example Usage:**
```bash
toilet "Hello World"
toilet -f mono12 "Big Text"
toilet --gay "Rainbow"         # Rainbow filter
toilet --metal "Metallic"      # Metallic filter
```

---

### 2.3 Cowsay
| Attribute | Details |
|-----------|---------|
| **Original** | Tony Monroe (Perl) |
| **Neo-cowsay (Go)** | [Code-Hex/Neo-cowsay](https://github.com/Code-Hex/Neo-cowsay) |

**Key Features:**
- Configurable talking cow with speech bubble
- Extensive collection of alternate characters (tux, dragon, ghostbusters, etc.)
- Neo-cowsay adds: UTF-8, random mode, color filters, fuzzy finder

**Installation:**
```bash
sudo apt install cowsay        # Original Perl
# Neo-cowsay (Go)
go install github.com/Code-Hex/Neo-cowsay/v2/cmd/cowsay@latest
```

**Example Usage:**
```bash
cowsay "Hello"
cowsay -f tux "Linux is great"    # Tux the penguin
cowsay -f dragon "Roar!"
echo "Hello" | cowsay
cowthink "Hmm..."                 # Thought bubble
```

---

### 2.4 Ponysay
| Attribute | Details |
|-----------|---------|
| **Language** | Python |
| **Description** | Full 256-colored cowsay-like art with 422+ ponies |

**Key Features:**
- 422+ My Little Pony characters
- Full 256-color support
- Syntax compatible with cowsay
- Custom pony creation support

**Installation:**
```bash
pip install ponysay
# Or from AUR
yay -S ponysay
```

**Example Usage:**
```bash
ponysay "Hello!"
ponysay -l                     # List all ponies
ponysay --pony twilight "Magic!"
```

---

### 2.5 Boxes
| Attribute | Details |
|-----------|---------|
| **GitHub** | [ascii-boxes/boxes](https://github.com/ascii-boxes/boxes) |
| **Stars** | 678 |
| **Language** | C (86.5%) |
| **License** | GPL-3.0 |
| **Last Commit** | May 2026 |

**Key Features:**
- Draws ASCII art boxes around input text
- 100+ built-in box designs
- Custom box design support
- Text alignment, padding
- Vim integration (boxes.vim)
- Available since 1999

**Installation:**
```bash
sudo apt install boxes         # Debian/Ubuntu
brew install boxes             # macOS
```

**Example Usage:**
```bash
echo "Hello" | boxes
echo "Hello" | boxes -d parchment
echo "Hello" | boxes -d dog    # Dog-themed box
echo "Hello" | boxes -a c -d diamond  # Centered in diamond
```

---

## 3. Animated ASCII / Terminal Screensavers

### 3.1 CMatrix (Matrix Digital Rain)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [abishekvashok/cmatrix](https://github.com/abishekvashok/cmatrix) |
| **Stars** | 5.1k |
| **Language** | C (61.8%) |
| **License** | GPL-3.0 |
| **Last Commit** | Dec 2023 |

**Key Features:**
- Recreates the Matrix "digital rain" effect
- Configurable colors (green, red, blue, white, yellow, etc.)
- Bold characters mode
- Asynchronous scroll
- Custom font support (matrix.fnt)
- Screensaver mode (-x)
- Lambdamode (-l)
- Original by Chris Allegretta, maintained by Abishek V Ashok

**Installation:**
```bash
sudo apt install cmatrix       # Debian/Ubuntu
brew install cmatrix           # macOS
sudo pacman -S cmatrix         # Arch
```

**Example Usage:**
```bash
cmatrix                        # Default green rain
cmatrix -C red                 # Red rain
cmatrix -C blue -b             # Blue with bold
cmatrix -a                     # Asynchronous scroll
cmatrix -u 2                   # Update delay (0-10, lower=faster)
cmatrix -x                     # Screensaver mode (exits on keystroke)
```

---

### 3.2 Neo (Enhanced Matrix Rain)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [st3w/neo](https://github.com/st3w/neo) |
| **Stars** | 914 |
| **Language** | C++ (95.2%) |
| **License** | GPL-3.0 |
| **Last Commit** | Feb 2022 |

**Key Features:**
- CMatrix clone with 32-bit color and Unicode support
- Half-width katakana characters (authentic Matrix feel)
- Glitchy, uneven color effects
- Fully customizable colors and characters
- Message display (Matrix title crawl style)
- Automatic terminal capability detection

**Installation:**
```bash
# Build from source
git clone https://github.com/st3w/neo.git
cd neo && ./autogen.sh && ./configure && make && sudo make install
```

**Example Usage:**
```bash
neo                            # Default
eo --fgcolor green --bgcolor black  # Custom colors
neo --chars katakana           # Katakana only
neo --message "THE MATRIX"     # Display message
```

---

### 3.3 Pipes.sh
| Attribute | Details |
|-----------|---------|
| **GitHub** | [pipeseroni/pipes.sh](https://github.com/pipeseroni/pipes.sh) |
| **Stars** | 3k |
| **Language** | Shell (87.6%) |
| **License** | MIT |
| **Last Commit** | Apr 2018 (stable) |

**Key Features:**
- Animated pipes terminal screensaver
- 10 different pipe styles (Unicode box drawing, curves, railway, etc.)
- Custom pipe characters support
- Colorful, endless entertainment
- Interactive controls (P/O for probability, F/D for framerate)
- Part of the Pipeseroni collective (multiple language ports)

**Installation:**
```bash
brew install pipes-sh          # macOS
# Or from source
git clone https://github.com/pipeseroni/pipes.sh.git
cd pipes.sh && make install
```

**Example Usage:**
```bash
pipes.sh                       # Default style
pipes.sh -t 1                  # Rounded corners
pipes.sh -t 3                  # Double lines
pipes.sh -t cMAYFORCEBWITHYOU  # Custom characters
pipes.sh -p 5                  # 5 pipes
pipes.sh -R                    # Random starting position
```

---

### 3.4 ASCIIQuarium
| Attribute | Details |
|-----------|---------|
| **Original** | Kirk Baucom (Perl) |
| **Python Port** | [MKAbuMattar/asciiquarium-python](https://github.com/MKAbuMattar/asciiquarium-python) |
| **Language** | Python |
| **License** | GPL-3.0 |

**Key Features:**
- ASCII art aquarium with fish, sharks, whales
- Ships sailing on surface
- Sea monsters and castles
- Animated bubbles and seaweed
- Full color support
- Interactive controls (pause, redraw, info)
- Cross-platform (original Perl needs curses)

**Installation:**
```bash
pip install asciiquarium       # Python port
# Original Perl
sudo apt install libcurses-perl
cpan install Term::Animation
wget https://robobunny.com/projects/asciiquarium/html/asciiquarium.tar.gz
```

**Example Usage:**
```bash
asciiquarium                   # Start aquarium
# Controls: Q=quit, P=pause, R=redraw, I=info
```

---

### 3.5 Nyan Cat
| Attribute | Details |
|-----------|---------|
| **GitHub** | [klange/nyancat](https://github.com/klange/nyancat) (original C) |
| **Go Version** | [NARKOZ/go-nyancat](https://github.com/NARKOZ/go-nyancat) |
| **Terminal** | [taizilongxu/nyancat](https://github.com/taizilongxu/nyancat) (14 stars) |

**Key Features:**
- The iconic Nyan Cat animation in terminal
- Rainbow trail, Pop-Tart body, 8-bit music
- Telnet server available (`telnet nyancat.dakko.us`)

**Installation:**
```bash
sudo apt install nyancat       # Debian/Ubuntu
brew install nyancat           # macOS
# Go version
go install github.com/NARKOZ/go-nyancat@latest
```

**Example Usage:**
```bash
nyancat                        # Start Nyan Cat
telnet nyancat.dakko.us        # Via telnet
```

---

## 4. Terminal Image Viewers

### 4.1 Timg (Image + Video)
*(See section 1.4 for full details - 2.6k stars)*

**Key distinction:** Timg is the ONLY tool that supports both images AND videos natively, making it unique among terminal image viewers.

---

### 4.2 Ueberzug++
| Attribute | Details |
|-----------|---------|
| **GitHub** | [jstkdng/ueberzugpp](https://github.com/jstkdng/ueberzugpp) |
| **Stars** | 1.3k |
| **Language** | C++ (92.8%) |
| **License** | GPL-3.0 |
| **Last Commit** | May 2026 (very active) |

**Key Features:**
- Drop-in replacement for ueberzug (Python, now defunct)
- X11/Wayland child window rendering
- Sixel, Kitty, iTerm2 protocol support
- Wayland support (sway, hyprland, niri, wayfire)
- macOS support
- No memory leaks (smart pointers)
- GIF and animated WEBP support
- Fast image downscaling (OpenCV + OpenCL)
- tmux support

**Installation:**
```bash
brew install jstkdng/programs/ueberzugpp    # macOS/Linux
# Or from OBS repository (Debian/Fedora)
```

---

### 4.3 Viu
*(See section 1.3 for full details - 3.2k stars, Rust)*

---

### 4.4 Chafa
*(See section 1.1 for full details - 4.9k stars, C)*

---

## 5. GIF-to-ASCII Converters

### 5.1 gif-for-cli (Google)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [google/gif-for-cli](https://github.com/google/gif-for-cli) |
| **Stars** | 3k |
| **Language** | Python (100%) |
| **License** | Apache-2.0 |
| **Status** | Archived Oct 2024 (read-only) |

**Key Features:**
- Google's official GIF-to-ASCII converter
- Takes GIF, short video, or Tenor GIF API query
- Converts to animated ASCII art with ANSI escape sequences
- Auto-detects terminal color capabilities
- Caches converted frames
- Integrates with Tenor GIF API

**Installation:**
```bash
pip3 install gif-for-cli
```

**Example Usage:**
```bash
gif-for-cli "funny cat"         # Search Tenor
gif-for-cli animation.gif       # Local GIF
gif-for-cli video.mp4           # Convert video
```

---

### 5.2 ASCII Image Converter
*(See section 1.2 for full details - also supports GIF, 3.3k stars, Go)*

---

### 5.3 Viu
*(See section 1.3 - supports animated GIFs, 3.2k stars)*

---

## 6. Color & Style Effects

### 6.1 Lolcat (Rainbow Text)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [busyloop/lolcat](https://github.com/busyloop/lolcat) |
| **Stars** | 6.3k |
| **Language** | Ruby |
| **License** | BSD-3-Clause |
| **Last Commit** | Mar 2024 |

**Key Features:**
- Rainbow colorizes any text output
- Animation support (-a flag)
- Spread and frequency controls
- Works with any piped input
- The iconic tool for terminal rainbow effects

**Installation:**
```bash
gem install lolcat
sudo snap install lolcat       # Linux
brew install lolcat            # macOS
sudo apt install lolcat        # Debian/Ubuntu
```

**Example Usage:**
```bash
echo "Hello World" | lolcat
figlet "Hello" | lolcat
cat file.txt | lolcat
lolcat -a < file.txt           # Animated
fortune | cowsay | lolcat      # Classic combo
cmatrix | lolcat               # Rainbow Matrix!
```

---

### 6.2 Rainbow (Go clone)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [arsham/rainbow](https://github.com/arsham/rainbow) |
| **Stars** | ~100 (estimated) |
| **Language** | Go |
| **License** | Apache-2.0 |

**Key Features:**
- Go reimplementation of lolcat
- Faster than Ruby version
- Can be used as a library (io.Reader/io.Writer)
- Configurable seed for random colors

**Installation:**
```bash
go install github.com/arsham/rainbow/v2@latest
```

---

### 6.3 Gradience
- Various gradient tools exist; most popular is piping through custom scripts
- [ANSIEsc2HTML](https://github.com/pixelb/scripts/blob/master/scripts/ansi2html.sh) for color conversion

---

## 7. Charts & Plotting in Terminal

### 7.1 TTYplot (Real-time)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [tenox7/ttyplot](https://github.com/tenox7/ttyplot) |
| **Stars** | 1.4k |
| **Language** | C (73.1%) |
| **License** | Apache-2.0 |
| **Last Commit** | Mar 2026 |

**Key Features:**
- Real-time plotting from stdin/pipe
- Two-value plotting (in/out or read/write)
- Rate calculation for counter metrics
- Color customization
- Title and unit labels
- Hard max/min error indicators
- Works with ping, snmpget, vmstat, etc.

**Installation:**
```bash
brew install ttyplot           # macOS
sudo apt install ttyplot       # Debian/Ubuntu
git clone https://github.com/tenox7/ttyplot.git && cd ttyplot && make
```

**Example Usage:**
```bash
# CPU usage
vmstat -n 1 | gawk '{ print 100-int($(NF-2)); fflush(); }' | ttyplot -s 100 -t "CPU" -u "%"
# Ping plot
ping 8.8.8.8 | sed -u 's/^.*time=//g; s/ ms//g' | ttyplot -t "ping" -u ms
# Two-line network throughput
snmpdelta ... | ttyplot -2 -t "throughput" -u Mb/s
# Bitcoin price
{ while true; do curl -sL https://api.coindesk.com/v1/bpi/currentprice.json | jq .bpi.USD.rate_float; sleep 600; done } | ttyplot -t "bitcoin" -u usd
```

---

### 7.2 Termgraph
| Attribute | Details |
|-----------|---------|
| **GitHub** | [mkaz/termgraph](https://github.com/mkaz/termgraph) |
| **Stars** | ~1.5k (estimated) |
| **Language** | Python |
| **License** | MIT |

**Key Features:**
- Bar graphs from CSV data
- Stacked charts
- Color charts
- Custom tick marks (emoji support)
- Histogram mode
- Calendar heatmaps
- Vertical mode
- Both CLI and Python library

**Installation:**
```bash
pip3 install termgraph
```

**Example Usage:**
```bash
# Create data file
cat > data.csv << EOF
Python,85
JavaScript,72
Go,63
Rust,58
TypeScript,50
EOF

termgraph data.csv
termgraph data.csv --color {cyan}
termgraph data.csv --custom-tick "🚀" --title "Languages"
```

---

### 7.3 Mermaid CLI
| Attribute | Details |
|-----------|---------|
| **GitHub** | [mermaid-js/mermaid-cli](https://github.com/mermaid-js/mermaid-cli) |
| **Stars** | Part of Mermaid (mermaid-js has 80k+ stars) |
| **Language** | JavaScript/Node |
| **License** | MIT |

**Key Features:**
- Renders Mermaid diagrams from CLI
- Flowcharts, sequence diagrams, Gantt charts, etc.
- Outputs PNG, SVG, PDF
- Ideal for CI/CD documentation generation

**Installation:**
```bash
npm install -g @mermaid-js/mermaid-cli
# Or with npx
npx -p @mermaid-js/mermaid-cli mmdc -h
```

**Example Usage:**
```bash
mmdc -i diagram.mmd -o diagram.svg
mmdc -i input.mmd -o output.png -b transparent
```

---

## 8. Maps in Terminal

### 8.1 MapSCII (Braille World Map)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [rastapasta/mapscii](https://github.com/rastapasta/mapscii) |
| **Stars** | 9.1k |
| **Language** | JavaScript (99.6%) |
| **License** | MIT |
| **Last Commit** | Sep 2020 (stable) |

**Key Features:**
- Braille & ASCII world map renderer
- Mouse support (drag to pan, scroll to zoom)
- OpenStreetMap data
- Point-of-interest discovery
- Mapbox Styles support
- Can connect to any vector tile server
- Offline MBTiles support
- Telnet access: `telnet mapscii.me`

**Installation:**
```bash
npm install -g mapscii
sudo snap install mapscii
```

**Example Usage:**
```bash
mapscii                        # Start interactive map
telnet mapscii.me              # Via telnet (no install)
# Controls: Arrows=pan, a/z=zoom, c=switch mode, q=quit
# Mouse: drag to pan, scroll to zoom
```

---

## 9. Diagrams in Terminal

### 9.1 Graph::Easy (ASCII Graphs)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [ironcamel/Graph-Easy](https://github.com/ironcamel/Graph-Easy) |
| **Stars** | ~150 (estimated) |
| **Language** | Perl |
| **License** | GPL-2.0 |

**Key Features:**
- Renders graphs as ASCII art
- Nodes connected by edges with directional arrows
- Multiple output formats: ASCII, HTML, SVG, Graphviz DOT
- Simple text-based graph definition
- Edge styling (dotted, solid, bold)

**Installation:**
```bash
cpan Graph::Easy
# Or with package manager
sudo apt install graph-easy
```

**Example Usage:**
```bash
graph-easy <<'EOF'
[Bonn] -> [Berlin]
[Berlin] -> [Frankfurt]
[Frankfurt] -> [Dresden]
EOF

graph-easy --as=boxart <<'EOF'
[Server] -> [Database]
[Server] -> [Cache]
EOF
```

---

### 9.2 Graphviz
| Attribute | Details |
|-----------|---------|
| **Website** | [graphviz.org](https://graphviz.org) |
| **Language** | C |
| **License** | EPL-1.0 |

**Key Features:**
- The industry standard for graph rendering
- DOT language for graph description
- Multiple layout engines (dot, neato, circo, etc.)
- Output to PNG, SVG, PDF, PostScript
- Can be combined with Graph::Easy for ASCII output

**Installation:**
```bash
sudo apt install graphviz
brew install graphviz
```

**Example Usage:**
```bash
dot -Tpng input.dot -o output.png
dot -Tsvg graph.dot -o graph.svg
```

---

### 9.3 Mermaid CLI
*(See section 7.3)*

---

## 10. Drawing Tools

### 10.1 Draw (maaslalani)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [maaslalani/draw](https://github.com/maaslalani/draw) |
| **Stars** | ~300 (estimated) |
| **Language** | Go |
| **License** | MIT |

**Key Features:**
- Interactive drawing tool in terminal
- Mouse-based drawing (click and drag)
- Box drawing (right-click and drag)
- Text insertion mode
- Color support (7 colors via number keys)
- Automatic saving to file
- Character-based drawing with any key

**Installation:**
```bash
go install github.com/maaslalani/draw@latest
```

**Example Usage:**
```bash
draw                           # Start drawing
draw masterpiece.txt           # Save to specific file
# Controls: mouse draw, right-click=box, any key=draw with that char
# Colors: 1=red, 2=green, 3=yellow, 4=blue, 5=magenta, 6=cyan, 7=gray
```

---

### 10.2 Termdraw
| Attribute | Details |
|-----------|---------|
| **GitHub** | [benvinegar/termdraw](https://github.com/benvinegar/termdraw) |
| **Description** | Agent-friendly ASCII illustrator |

**Key Features:**
- Terminal drawing editor
- Editable diagrams
- UI mockup creation

---

## 11. Font & Typography / Presentations

### 11.1 Slides (Top Pick)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [maaslalani/slides](https://github.com/maaslalani/slides) |
| **Stars** | 11.5k |
| **Language** | Go (99.8%) |
| **License** | MIT |
| **Last Commit** | May 2024 |

**Key Features:**
- Terminal-based presentation tool
- Markdown-based slide authoring
- Syntax highlighting (nearly 100 languages)
- Code execution during presentation
- Theme support (multiple built-in themes)
- Slides automatically reload on edit
- Image display support
- Vim-style keybindings

**Installation:**
```bash
# macOS/Linux
brew install slides
# Go
go install github.com/maaslalani/slides@latest
# Arch
yay -S slides
```

**Example Usage:**
```bash
slides presentation.md
# Inside: j/down/next, k/up/prev, q/quit
```

**Sample Markdown:**
```markdown
# Welcome to Slides

---

## Code Example

```go
package main
import "fmt"
func main() {
    fmt.Println("Hello!")
}
```

---

## Thank You!
```

---

### 11.2 Patat (Pandoc-based)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [jaspervdj/patat](https://github.com/jaspervdj/patat) |
| **Stars** | 2.7k |
| **Language** | Haskell (98.5%) |
| **License** | GPL-2.0 |
| **Last Commit** | Feb 2026 |

**Key Features:**
- Presentations using Pandoc
- Supports Markdown, reST, Org-mode input
- Auto-reload on edit
- Speaker notes in second window
- Incremental slide display
- Image display support
- Transition effects
- Theming support (24-bit RGB)

**Installation:**
```bash
# Using cabal
cabal install patat
# Using stack
stack install patat
# Arch
sudo pacman -S patat
# macOS
brew install patat
```

**Example Usage:**
```bash
patat presentation.md
patat --watch presentation.md   # Auto-reload
```

---

### 11.3 Figlet Fonts Collection
| Attribute | Details |
|-----------|---------|
| **GitHub** | [xero/figlet-fonts](https://github.com/xero/figlet-fonts) |
| **Description** | Curated collection of 300+ figlet fonts |

**Key Features:**
- 300+ community-contributed fonts
- Categories: classic, 3D, decorative, gothic, modern
- Popular fonts: slant, block, bubble, digital, starwars, doom
- Easy installation to `/usr/share/figlet/`

**Installation:**
```bash
git clone https://github.com/xero/figlet-fonts.git
sudo cp figlet-fonts/* /usr/share/figlet/
# Usage
figlet -f starwars "Hello"
```

---

## 12. Progress Bars & Spinners

### 12.1 Yacspin (Go)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [theckman/yacspin](https://github.com/theckman/yacspin) |
| **Stars** | 456 |
| **Language** | Go |
| **License** | Apache-2.0 |

**Key Features:**
- 80+ built-in spinner character sets
- Customizable colors, suffix, prefix
- Success/fail final characters
- Multiple OS support (Linux, macOS, Windows)
- Dumb terminal fallback
- Highly configurable

**Installation:**
```bash
go get github.com/theckman/yacspin
```

**Example Usage (Go):**
```go
import "github.com/theckman/yacspin"
cfg := yacspin.Config{
    Frequency: 100 * time.Millisecond,
    CharSet:   yacspin.CharSets[59],
    Suffix:    " backing up database",
    StopCharacter: "✓",
    StopColors: []string{"fgGreen"},
}
spinner, _ := yacspin.New(cfg)
spinner.Start()
// ... do work ...
spinner.Stop()
```

---

### 12.2 Spinner (Go - briandowns)
| Attribute | Details |
|-----------|---------|
| **GitHub** | [briandowns/spinner](https://github.com/briandowns/spinner) |
| **Stars** | 3.1k |
| **Language** | Go |
| **License** | Apache-2.0 |

**Key Features:**
- 70+ spinner character sets
- Color support (via fatih/color)
- Pre-update functions
- Finalizer options (success/fail indicators)
- Multi-writer support
- Pausing/resuming

**Installation:**
```bash
go get github.com/briandowns/spinner
```

---

### 12.3 Progress Bar Libraries (Other Languages)

| Library | Language | Stars | Notes |
|---------|----------|-------|-------|
| [schollz/progressbar](https://github.com/schollz/progressbar) | Go | 4.5k | Thread-safe, customizable |
| [rivo/tview](https://github.com/rivo/tview) | Go | 9.8k | Full TUI library with progress |
| [Textual](https://github.com/Textualize/textual) | Python | 22k | Rich TUI with progress widgets |
| [tqdm](https://github.com/tqdm/tqdm) | Python | 27k | Most popular Python progress bar |
| [indicatif](https://github.com/console-rs/indicatif) | Rust | 4k | Rust progress bar library |

---

## 13. Ranked Recommendations

### Overall Top Picks by Category

| Rank | Tool | Category | Stars | Why |
|------|------|----------|-------|-----|
| 1 | **Chafa** | Image-to-ASCII | 4.9k | Most feature-complete, supports all protocols, excellent performance |
| 2 | **Slides** | Presentations | 11.5k | Best-in-class terminal presentations, huge community |
| 3 | **MapSCII** | Maps | 9.1k | Unique interactive world map, stunning Braille rendering |
| 4 | **Lolcat** | Color Effects | 6.3k | Iconic rainbow tool, simple & fun |
| 5 | **CMatrix** | Animated ASCII | 5.1k | The classic Matrix rain, widely loved |
| 6 | **ASCII Image Converter** | Image-to-ASCII | 3.3k | Best cross-platform CLI converter with Braille |
| 7 | **Viu** | Image Viewer | 3.2k | Best Rust-based viewer, clean codebase |
| 8 | **gif-for-cli** | GIF-to-ASCII | 3.0k | Google's solution, Tenor integration |
| 9 | **Timg** | Image/Video Viewer | 2.6k | Only tool with full video support |
| 10 | **Patat** | Presentations | 2.7k | Best for Pandoc users, very feature-rich |
| 11 | **Pipes.sh** | Screensaver | 3.0k | Mesmerizing, minimal, classic |
| 12 | **TTYplot** | Charts | 1.4k | Essential for real-time data visualization |
| 13 | **Ueberzug++** | Image Overlay | 1.3k | Critical for file manager image previews |
| 14 | **Neo** | Matrix Effect | 914 | Superior 32-bit color Matrix rain |
| 15 | **Boxes** | ASCII Art | 678 | Essential for text decoration |

### By Use Case

**For daily image viewing in terminal:** Chafa > Viu > Timg

**For making presentations:** Slides > Patat > present (Python)

**For fun/entertainment:** CMatrix > Pipes.sh > ASCIIQuarium > Nyan Cat

**For data visualization:** TTYplot > Termgraph > Mermaid CLI

**For developer tools:** ASCII Image Converter (build scripts) > Boxes (documentation) > Figlet (headers)

**For progress indication (libraries):** tqdm (Python) > indicatif (Rust) > schollz/progressbar (Go)

### Quick-Start Combo (The Essential Toolkit)

```bash
# Install the essentials
sudo apt install chafa cmatrix figlet toilet cowsay lolcat boxes   # Debian/Ubuntu
brew install chafa cmatrix figlet toilet cowsay lolcat boxes        # macOS

# The classic pipeline
fortune | cowsay | lolcat

# Image preview
chafa image.jpg

# Matrix effect
cmatrix -C green -b

# Banner
figlet -f slant "Welcome" | lolcat

# Boxed message
echo "Important!" | boxes -d diamond | lolcat
```

---

## References

[^1^]: hpjansson/chafa GitHub repository, visited 2025
[^2^]: hzeller/timg GitHub repository, 2.6k stars
[^3^]: atanunq/viu GitHub repository, 3.2k stars
[^4^]: TheZoraiz/ascii-image-converter GitHub repository, 3.3k stars
[^5^]: abishekvashok/cmatrix GitHub repository, 5.1k stars
[^6^]: st3w/neo GitHub repository, 914 stars
[^7^]: pipeseroni/pipes.sh GitHub repository, 3k stars
[^8^]: rastapasta/mapscii GitHub repository, 9.1k stars
[^9^]: busyloop/lolcat GitHub repository, 6.3k stars
[^10^]: maaslalani/slides GitHub repository, 11.5k stars
[^11^]: jaspervdj/patat GitHub repository, 2.7k stars
[^12^]: tenox7/ttyplot GitHub repository, 1.4k stars
[^13^]: jstkdng/ueberzugpp GitHub repository, 1.3k stars
[^14^]: ascii-boxes/boxes GitHub repository, 678 stars
[^15^]: cacalabs/toilet GitHub repository, 300 stars
[^16^]: google/gif-for-cli GitHub repository, 3k stars
[^17^]: mkaz/termgraph GitHub repository
[^18^]: theckman/yacspin GitHub repository, 456 stars
[^19^]: stefanhaustein/TerminalImageViewer GitHub repository
[^20^]: posva/catimg GitHub repository
[^21^]: jroimartin/present GitHub repository
[^22^]: ironcamel/Graph-Easy GitHub repository
[^23^]: mermaid-js/mermaid-cli GitHub repository
[^24^]: MKAbuMattar/asciiquarium-python GitHub repository
[^25^]: maaslalani/draw GitHub repository
