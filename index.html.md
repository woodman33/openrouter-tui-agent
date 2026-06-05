<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="@frontend-design-for-distinctive-interfaces @gsap-react-installation @stitch-ui-full

Design a premium frontend prototype for **TIMMYTUI**, a terminal-first **Agent Trust OS**.

TIMMYTUI is not a dashboard. It is a chat-first command center for:

1. routing agent work,
2. turning MCP tools into CLIs,
3. launching real terminal workspaces,
4. proving work with tamper-evident receipts.

Core product line:
**Capability → Control → Proof → Reuse**

Core sentence:
**Any tool can become a command. Any command can become governed work. Any governed work can become proof.**

Use a persistent 3-zone layout:

1. **Left Nav**
   - Brief
   - Porter
   - Workspace
   - Proof
   - Options

2. **Main Stage**
   - One screen, one job.
   - Spacious, calm, readable.

3. **Right Trust Inspector**
   - Shows selected item details:
   - AgentPass state
   - Visa state
   - risk class
   - scope
   - receipt state

Bottom trust rail:
`AgentPass VERIFIED | Visa READY | Stamp ARMED | Receipt READY | Cost $0.0000`

## Page 1 — Brief

Purpose: user intent.

Design:

- Spacious chat screen.
- One input.
- Three primary actions:
  - Add Tool by URL
  - Open Workspace
  - View Last Receipt

Include a subtle TIMMY Quartermaster guide line:
“Tell TIMMY the mission. I’ll route the work, guard the tools, and seal the receipt.”

No dashboards. No telemetry wall.

## Page 2 — Porter

Purpose: MCP-to-CLI bridge.

Make this visually obvious:

`MCP Server URL → MCPorter Scan → Generated CLI → AgentPass Scope → TIMMY Receipt`

Show command chips:

- `/porter add <url>`
- `/porter list`
- `/porter inspect`
- `/porter approve`
- `/porter cli`

Show one example card:

- Source: GitHub MCP Server
- Generated CLI: `github-mcp-cli`
- Risk: medium
- Status: gated / ready for approval

Emotional job:
“Your tools can become governed commands.”

## Page 3 — Workspace

Purpose: launch real work.

This is a launcher, not fake terminal panes.

Primary actions:

- Open in cmux
- Open in tmux
- Call Previous Work
- Attach Receipt

Positioning:

- **cmux** = clickable workspace shell with panes/browser
- **tmux** = reliable fallback execution backend

Show:

- cmux: installed / ready
- tmux: active / fallback ready

Emotional job:
“Launch real agent work in the right shell.”

## Page 4 — Proof

Purpose: make receipts understandable.

Start with a clear receipt card.

Show:

- What ran
- Which agent ran it
- Which tools were used
- What was approved
- What changed
- Manifest hash
- Receipt status

Use only:

- tamper-evident
- hash-bound
- verifiable
- manifest hash
- sealed TIMMY receipt

Do not use:

- cryptographic
- signed
- immutable
- notarized

Raw logs/diffs are collapsed secondary details.

Emotional job:
“Trust the receipt, not the model.”

## Page 5 — Options

Purpose: customize without clutter.

Compact rows:

- Theme
- Animation
- Mascot
- Layout density
- OpenRouter
- Pi Agent
- Hermes
- MCPorter
- cmux/tmux
- Proof style

Each row:
`Label | current value | short explanation | action`

## Visual style

Dark terminal-native premium UI:

- black / charcoal base
- blue = proof
- green = verified
- amber = warning/action
- purple = TIMMY / agents
- thin borders
- generous whitespace
- no clutter
- no cyberpunk chaos
- no generic SaaS dashboard

## Animation

Use GSAP only for prototype polish:

- selected nav glow
- typewriter Quartermaster hint
- MCPorter pipeline progress
- visa stamp
- receipt seal
- button hover/focus

Animations must be restrained and premium.

## Deliverable

Create a clickable frontend prototype with:

- persistent left nav
- five pages
- right Trust Inspector
- bottom trust rail
- realistic mock data
- button interactions
- dropdown/popover interactions
- smooth page transitions

Do not implement real backend calls, secrets, billing, Cloudflare, Stripe, or live agent execution. Mock data only.

Acceptance criteria:

- Looks like a premium terminal product.
- Brief feels like a real chat app.
- Porter clearly explains MCP → CLI → AgentPass → Receipt.
- Workspace makes cmux feel important.
- Proof is readable to a normal buyer.
- Options is compact and useful.
- No wasted space.

IMPORTANT: Use every attached file, analyzed image, Figma import, and @ reference below as required context for the output.**Referenced Skills:**

### Interaction Design

---

name: interaction-design
description: Design and implement microinteractions, motion design, transitions, and user feedback patterns. Use when adding polish to UI interactions, implementing loading states, or creating delightful user experiences.
keywords: ux-design, ui-design, animation, micro-interactions, transitions, best-practices, javascript, css
---

# Interaction Design

Create engaging, intuitive interactions through motion, feedback, and thoughtful state transitions that enhance usability and delight users.

## When to Use This Skill

- Adding microinteractions to enhance user feedback
- Implementing smooth page and component transitions
- Designing loading states and skeleton screens
- Creating gesture-based interactions
- Building notification and toast systems
- Implementing drag-and-drop interfaces
- Adding scroll-triggered animations
- Designing hover and focus states

## Core Principles

### 1. Purposeful Motion

Motion should communicate, not decorate:

- **Feedback**: Confirm user actions occurred
- **Orientation**: Show where elements come from/go to
- **Focus**: Direct attention to important changes
- **Continuity**: Maintain context during transitions

### 2. Timing Guidelines

| Duration  | Use Case                                  |
| --------- | ----------------------------------------- |
| 100-150ms | Micro-feedback (hovers, clicks)           |
| 200-300ms | Small transitions (toggles, dropdowns)    |
| 300-500ms | Medium transitions (modals, page changes) |
| 500ms+    | Complex choreographed animations          |

### 3. Easing Functions

```css
/* Common easings */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* Decelerate - entering */
--ease-in: cubic-bezier(0.55, 0, 1, 0.45); /* Accelerate - exiting */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* Both - moving between */
--spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot - playful */
```

## Quick Start: Button Microinteraction

```tsx
import { motion } from "framer-motion";

export function InteractiveButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      {children}
    </motion.button>
  );
}
```

## Interaction Patterns

### 1. Loading States

**Skeleton Screens**: Preserve layout while loading

```tsx
function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-lg" />
      <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
      <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

**Progress Indicators**: Show determinate progress

```tsx
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-blue-600"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut" }}
      />
    </div>
  );
}
```

### 2. State Transitions

**Toggle with smooth transition**:

```tsx
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative w-12 h-6 rounded-full transition-colors duration-200
        ${checked ? "bg-blue-600" : "bg-gray-300"}
      `}
    >
      <motion.span
        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
```

### 3. Page Transitions

**Framer Motion layout animations**:

```tsx
import { AnimatePresence, motion } from "framer-motion";

function PageTransition({ children, key }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 4. Feedback Patterns

**Ripple effect on click**:

```tsx
function RippleButton({ children, onClick }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now(),
    };
    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);
    onClick?.(e);
  };

  return (
    <button onClick={handleClick} className="relative overflow-hidden">
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </button>
  );
}
```

### 5. Gesture Interactions

**Swipe to dismiss**:

```tsx
function SwipeCard({ children, onDismiss }) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onDismiss();
        }
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}
```

## CSS Animation Patterns

### Keyframe Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
```

### CSS Transitions

```css
.card {
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
```

## Accessibility Considerations

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
function AnimatedComponent() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    />
  );
}
```

## Best Practices

1. **Performance First**: Use `transform` and `opacity` for smooth 60fps
2. **Reduce Motion Support**: Always respect `prefers-reduced-motion`
3. **Consistent Timing**: Use a timing scale across the app
4. **Natural Physics**: Prefer spring animations over linear
5. **Interruptible**: Allow users to cancel long animations
6. **Progressive Enhancement**: Work without JS animations
7. **Test on Devices**: Performance varies significantly

## Common Issues

- **Janky Animations**: Avoid animating `width`, `height`, `top`, `left`
- **Over-animation**: Too much motion causes fatigue
- **Blocking Interactions**: Never prevent user input during animations
- **Memory Leaks**: Clean up animation listeners on unmount
- **Flash of Content**: Use `will-change` sparingly for optimization

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [CSS Animation Guide](https://web.dev/animations-guide/)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)
- [GSAP Animation Library](https://greensock.com/gsap/)

### UI/UX Pro Max - Design Intelligence

---

keywords: ui-design, ux-design, design-system, accessibility, best-practices, responsive, typography, color
---

name: ui-ux-pro-max description: "UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples."
UI/UX Pro Max - Design Intelligence
Comprehensive design guide for web and mobile applications. Contains 50+ styles, 97 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 9 technology stacks. Searchable database with priority-based recommendations.

When to Apply
Reference these guidelines when:

Designing new UI components or pages
Choosing color palettes and typography
Reviewing code for UX issues
Building landing pages or dashboards
Implementing accessibility requirements
Rule Categories by Priority
Priority Category Impact Domain
1 Accessibility CRITICAL ux
2 Touch & Interaction CRITICAL ux
3 Performance HIGH ux
4 Layout & Responsive HIGH ux
5 Typography & Color MEDIUM typography, color
6 Animation MEDIUM ux
7 Style Selection MEDIUM style, product
8 Charts & Data LOW chart
Quick Reference

1. Accessibility (CRITICAL)
color-contrast - Minimum 4.5:1 ratio for normal text
focus-states - Visible focus rings on interactive elements
alt-text - Descriptive alt text for meaningful images
aria-labels - aria-label for icon-only buttons
keyboard-nav - Tab order matches visual order
form-labels - Use label with for attribute
2. Touch & Interaction (CRITICAL)
touch-target-size - Minimum 44x44px touch targets
hover-vs-tap - Use click/tap for primary interactions
loading-buttons - Disable button during async operations
error-feedback - Clear error messages near problem
cursor-pointer - Add cursor-pointer to clickable elements
3. Performance (HIGH)
image-optimization - Use WebP, srcset, lazy loading
reduced-motion - Check prefers-reduced-motion
content-jumping - Reserve space for async content
4. Layout & Responsive (HIGH)
viewport-meta - width=device-width initial-scale=1
readable-font-size - Minimum 16px body text on mobile
horizontal-scroll - Ensure content fits viewport width
z-index-management - Define z-index scale (10, 20, 30, 50)
5. Typography & Color (MEDIUM)
line-height - Use 1.5-1.75 for body text
line-length - Limit to 65-75 characters per line
font-pairing - Match heading/body font personalities
6. Animation (MEDIUM)
duration-timing - Use 150-300ms for micro-interactions
transform-performance - Use transform/opacity, not width/height
loading-states - Skeleton screens or spinners
7. Style Selection (MEDIUM)
style-match - Match style to product type
consistency - Use same style across all pages
no-emoji-icons - Use SVG icons, not emojis
8. Charts & Data (LOW)
chart-type - Match chart type to data type
color-guidance - Use accessible color palettes
data-table - Provide table alternative for accessibility
How to Use
Search specific domains using the CLI tool below.

Prerequisites
Check if Python is installed:

python3 --version || python --version
If Python is not installed, install it based on user's OS:

macOS:

brew install python3
Ubuntu/Debian:

sudo apt update && sudo apt install python3
Windows:

winget install Python.Python.3.12
How to Use This Skill
When user requests UI/UX work (design, build, create, implement, review, fix, improve), follow this workflow:

Step 1: Analyze User Requirements
Extract key information from user request:

Product type: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
Style keywords: minimal, playful, professional, elegant, dark mode, etc.
Industry: healthcare, fintech, gaming, education, etc.
Stack: React, Vue, Next.js, or default to html-tailwind
Step 2: Generate Design System (REQUIRED)
Always start with --design-system to get comprehensive recommendations with reasoning:

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
This command:

Searches 5 domains in parallel (product, style, color, landing, typography)
Applies reasoning rules from ui-reasoning.csv to select best matches
Returns complete design system: pattern, style, colors, typography, effects
Includes anti-patterns to avoid
Example:

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
Step 3: Supplement with Detailed Searches (as needed)
After getting the design system, use domain searches to get additional details:

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
When to use detailed searches:

Need Domain Example
More style options style --domain style "glassmorphism dark"
Chart recommendations chart --domain chart "real-time dashboard"
UX best practices ux --domain ux "animation accessibility"
Alternative fonts typography --domain typography "elegant luxury"
Landing structure landing --domain landing "hero social-proof"
Step 4: Stack Guidelines (Default: html-tailwind)
Get implementation-specific best practices. If user doesn't specify a stack, default to html-tailwind.

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack html-tailwind
Available stacks: html-tailwind, react, nextjs, vue, svelte, swiftui, react-native, flutter, shadcn

Search Reference
Available Domains
Domain Use For Example Keywords
product Product type recommendations SaaS, e-commerce, portfolio, healthcare, beauty, service
style UI styles, colors, effects glassmorphism, minimalism, dark mode, brutalism
typography Font pairings, Google Fonts elegant, playful, professional, modern
color Color palettes by product type saas, ecommerce, healthcare, beauty, fintech, service
landing Page structure, CTA strategies hero, hero-centric, testimonial, pricing, social-proof
chart Chart types, library recommendations trend, comparison, timeline, funnel, pie
ux Best practices, anti-patterns animation, accessibility, z-index, loading
react React/Next.js performance waterfall, bundle, suspense, memo, rerender, cache
web Web interface guidelines aria, focus, keyboard, semantic, virtualize
prompt AI prompts, CSS keywords (style name)
Available Stacks
Stack Focus
html-tailwind Tailwind utilities, responsive, a11y (DEFAULT)
react State, hooks, performance, patterns
nextjs SSR, routing, images, API routes
vue Composition API, Pinia, Vue Router
svelte Runes, stores, SvelteKit
swiftui Views, State, Navigation, Animation
react-native Components, Navigation, Lists
flutter Widgets, State, Layout, Theming
shadcn shadcn/ui components, theming, forms, patterns
Example Workflow
User request: "Làm landing page cho dịch vụ chăm sóc da chuyên nghiệp"

Step 1: Analyze Requirements
Product type: Beauty/Spa service
Style keywords: elegant, professional, soft
Industry: Beauty/Wellness
Stack: html-tailwind (default)
Step 2: Generate Design System (REQUIRED)
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
Output: Complete design system with pattern, style, colors, typography, effects, and anti-patterns.

Step 3: Supplement with Detailed Searches (as needed)

# Get UX guidelines for animation and accessibility

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "animation accessibility" --domain ux

# Get alternative typography options if needed

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "elegant luxury serif" --domain typography
Step 4: Stack Guidelines
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "layout responsive form" --stack html-tailwind
Then: Synthesize design system + detailed searches and implement the design.

Output Formats
The --design-system flag supports two output formats:

# ASCII box (default) - best for terminal display

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation

python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
Tips for Better Results
Be specific with keywords - "healthcare SaaS dashboard" > "app"
Search multiple times - Different keywords reveal different insights
Combine domains - Style + Typography + Color = Complete design system
Always check UX - Search "animation", "z-index", "accessibility" for common issues
Use stack flag - Get implementation-specific best practices
Iterate - If first search doesn't match, try different keywords
Common Rules for Professional UI
These are frequently overlooked issues that make UI look unprofessional:

Icons & Visual Elements
Rule Do Don't
No emoji icons Use SVG icons (Heroicons, Lucide, Simple Icons) Use emojis like 🎨 🚀 ⚙️ as UI icons
Stable hover states Use color/opacity transitions on hover Use scale transforms that shift layout
Correct brand logos Research official SVG from Simple Icons Guess or use incorrect logo paths
Consistent icon sizing Use fixed viewBox (24x24) with w-6 h-6 Mix different icon sizes randomly
Interaction & Cursor
Rule Do Don't
Cursor pointer Add cursor-pointer to all clickable/hoverable cards Leave default cursor on interactive elements
Hover feedback Provide visual feedback (color, shadow, border) No indication element is interactive
Smooth transitions Use transition-colors duration-200 Instant state changes or too slow (>500ms)
Light/Dark Mode Contrast
Rule Do Don't
Glass card light mode Use bg-white/80 or higher opacity Use bg-white/10 (too transparent)
Text contrast light Use #0F172A (slate-900) for text Use #94A3B8 (slate-400) for body text
Muted text light Use #475569 (slate-600) minimum Use gray-400 or lighter
Border visibility Use border-gray-200 in light mode Use border-white/10 (invisible)
Layout & Spacing
Rule Do Don't
Floating navbar Add top-4 left-4 right-4 spacing Stick navbar to top-0 left-0 right-0
Content padding Account for fixed navbar height Let content hide behind fixed elements
Consistent max-width Use same max-w-6xl or max-w-7xl Mix different container widths
Pre-Delivery Checklist
Before delivering UI code, verify these items:

Visual Quality
[ ] No emojis used as icons (use SVG instead)
[ ] All icons from consistent icon set (Heroicons/Lucide)
[ ] Brand logos are correct (verified from Simple Icons)
[ ] Hover states don't cause layout shift
[ ] Use theme colors directly (bg-primary) not var() wrapper
Interaction
[ ] All clickable elements have cursor-pointer
[ ] Hover states provide clear visual feedback
[ ] Transitions are smooth (150-300ms)
[ ] Focus states visible for keyboard navigation
Light/Dark Mode
[ ] Light mode text has sufficient contrast (4.5:1 minimum)
[ ] Glass/transparent elements visible in light mode
[ ] Borders visible in both modes
[ ] Test both modes before delivery
Layout
[ ] Floating elements have proper spacing from edges
[ ] No content hidden behind fixed navbars
[ ] Responsive at 375px, 768px, 1024px, 1440px
[ ] No horizontal scroll on mobile
Accessibility
[ ] All images have alt text
[ ] Form inputs have labels
[ ] Color is not the only indicator
[ ] prefers-reduced-motion respected

### Design Engineering

---

name: emil-design-eng
description: This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.
keywords: ui-design, ux-design, animation, motion, best-practices, components, css, performance
---

# Design Engineering

## Initial Response

When this skill is first invoked without a specific question, respond only with:

> I'm ready to help you build interfaces that feel right, my knowledge comes from Emil Kowalski's design engineering philosophy. If you want to dive even deeper, check out Emil’s course: [animations.dev](https://animations.dev/).

Do not provide any other information until the user asks a question.

You are a design engineer with the craft sensibility. You build interfaces where every detail compounds into something that feels right. You understand that in a world where everyone's software is good enough, taste is the differentiator.

## Core Philosophy

### Taste is trained, not innate

Good taste is not personal preference. It is a trained instinct: the ability to see beyond the obvious and recognize what elevates. You develop it by surrounding yourself with great work, thinking deeply about why something feels good, and practicing relentlessly.

When building UI, don't just make it work. Study why the best interfaces feel the way they do. Reverse engineer animations. Inspect interactions. Be curious.

### Unseen details compound

Most details users never consciously notice. That is the point. When a feature functions exactly as someone assumes it should, they proceed without giving it a second thought. That is the goal.

> "All those unseen details combine to produce something that's just stunning, like a thousand barely audible voices all singing in tune." - Paul Graham

Every decision below exists because the aggregate of invisible correctness creates interfaces people love without knowing why.

### Beauty is leverage

People select tools based on the overall experience, not just functionality. Good defaults and good animations are real differentiators. Beauty is underutilized in software. Use it as leverage to stand out.

## Review Format (Required)

When reviewing UI code, you MUST use a markdown table with Before/After columns. Do NOT use a list with "Before:" and "After:" on separate lines. Always output an actual markdown table like this:

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms ease-out` | Specify exact properties; avoid `all` |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing in the real world appears from nothing |
| `ease-in` on dropdown | `ease-out` with custom curve | `ease-in` feels sluggish; `ease-out` gives instant feedback |
| No `:active` state on button | `transform: scale(0.97)` on `:active` | Buttons must feel responsive to press |
| `transform-origin: center` on popover | `transform-origin: var(--radix-popover-content-transform-origin)` | Popovers should scale from their trigger (not modals — modals stay centered) |

Wrong format (never do this):

```
Before: transition: all 300ms
After: transition: transform 200ms ease-out
────────────────────────────
Before: scale(0)
After: scale(0.95)
```

Correct format: A single markdown table with | Before | After | Why | columns, one row per issue found. The "Why" column briefly explains the reasoning.

## The Animation Decision Framework

Before writing any animation code, answer these questions in order:

### 1. Should this animate at all?

**Ask:** How often will users see this animation?

| Frequency                                                   | Decision                     |
| ----------------------------------------------------------- | ---------------------------- |
| 100+ times/day (keyboard shortcuts, command palette toggle) | No animation. Ever.          |
| Tens of times/day (hover effects, list navigation)          | Remove or drastically reduce |
| Occasional (modals, drawers, toasts)                        | Standard animation           |
| Rare/first-time (onboarding, feedback forms, celebrations)  | Can add delight              |

**Never animate keyboard-initiated actions.** These actions are repeated hundreds of times daily. Animation makes them feel slow, delayed, and disconnected from the user's actions.

Raycast has no open/close animation. That is the optimal experience for something used hundreds of times a day.

### 2. What is the purpose?

Every animation must have a clear answer to "why does this animate?"

Valid purposes:

- **Spatial consistency**: toast enters and exits from the same direction, making swipe-to-dismiss feel intuitive
- **State indication**: a morphing feedback button shows the state change
- **Explanation**: a marketing animation that shows how a feature works
- **Feedback**: a button scales down on press, confirming the interface heard the user
- **Preventing jarring changes**: elements appearing or disappearing without transition feel broken

If the purpose is just "it looks cool" and the user will see it often, don't animate.

### 3. What easing should it use?

Is the element entering or exiting?
  Yes → ease-out (starts fast, feels responsive)
  No →
    Is it moving/morphing on screen?
      Yes → ease-in-out (natural acceleration/deceleration)
    Is it a hover/color change?
      Yes → ease
    Is it constant motion (marquee, progress bar)?
      Yes → linear
    Default → ease-out

**Critical: use custom easing curves.** The built-in CSS easings are too weak. They lack the punch that makes animations feel intentional.

```css
/* Strong ease-out for UI interactions */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);

/* Strong ease-in-out for on-screen movement */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

/* iOS-like drawer curve (from Ionic Framework) */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**Never use ease-in for UI animations.** It starts slow, which makes the interface feel sluggish and unresponsive. A dropdown with `ease-in` at 300ms _feels_ slower than `ease-out` at the same 300ms, because ease-in delays the initial movement — the exact moment the user is watching most closely.

**Easing curve resources:** Don't create curves from scratch. Use [easing.dev](https://easing.dev/) or [easings.co](https://easings.co/) to find stronger custom variants of standard easings.

### 4. How fast should it be?

| Element                  | Duration      |
| ------------------------ | ------------- |
| Button press feedback    | 100-160ms     |
| Tooltips, small popovers | 125-200ms     |
| Dropdowns, selects       | 150-250ms     |
| Modals, drawers          | 200-500ms     |
| Marketing/explanatory    | Can be longer |

**Rule: UI animations should stay under 300ms.** A 180ms dropdown feels more responsive than a 400ms one. A faster-spinning spinner makes the app feel like it loads faster, even when the load time is identical.

### Perceived performance

Speed in animation is not just about feeling snappy — it directly affects how users perceive your app's performance:

- A **fast-spinning spinner** makes loading feel faster (same load time, different perception)
- A **180ms select** animation feels more responsive than a **400ms** one
- **Instant tooltips** after the first one is open (skip delay + skip animation) make the whole toolbar feel faster

The perception of speed matters as much as actual speed. Easing amplifies this: `ease-out` at 200ms _feels_ faster than `ease-in` at 200ms because the user sees immediate movement.

## Spring Animations

Springs feel more natural than duration-based animations because they simulate real physics. They don't have fixed durations — they settle based on physical parameters.

### When to use springs

- Drag interactions with momentum
- Elements that should feel "alive" (like Apple's Dynamic Island)
- Gestures that can be interrupted mid-animation
- Decorative mouse-tracking interactions

### Spring-based mouse interactions

Tying visual changes directly to mouse position feels artificial because it lacks motion. Use `useSpring` from Motion (formerly Framer Motion) to interpolate value changes with spring-like behavior instead of updating immediately.

```jsx
import { useSpring } from 'framer-motion';

// Without spring: feels artificial, instant
const rotation = mouseX * 0.1;

// With spring: feels natural, has momentum
const springRotation = useSpring(mouseX * 0.1, {
  stiffness: 100,
  damping: 10,
});
```

This works because the animation is **decorative** — it doesn't serve a function. If this were a functional graph in a banking app, no animation would be better. Know when decoration helps and when it hinders.

### Spring configuration

**Apple's approach (recommended — easier to reason about):**

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

**Traditional physics (more control):**

```js
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

Keep bounce subtle (0.1-0.3) when used. Avoid bounce in most UI contexts. Use it for drag-to-dismiss and playful interactions.

### Interruptibility advantage

Springs maintain velocity when interrupted — CSS animations and keyframes restart from zero. This makes springs ideal for gestures users might change mid-motion. When you click an expanded item and quickly press Escape, a spring-based animation smoothly reverses from its current position.

## Component Building Principles

### Buttons must feel responsive

Add `transform: scale(0.97)` on `:active`. This gives instant feedback, making the UI feel like it is truly listening to the user.

```css
.button {
  transition: transform 160ms ease-out;
}

.button:active {
  transform: scale(0.97);
}
```

This applies to any pressable element. The scale should be subtle (0.95-0.98).

### Never animate from scale(0)

Nothing in the real world disappears and reappears completely. Elements animating from `scale(0)` look like they come out of nowhere.

Start from `scale(0.9)` or higher, combined with opacity. Even a barely-visible initial scale makes the entrance feel more natural, like a balloon that has a visible shape even when deflated.

```css
/* Bad */
.entering {
  transform: scale(0);
}

/* Good */
.entering {
  transform: scale(0.95);
  opacity: 0;
}
```

### Make popovers origin-aware

Popovers should scale in from their trigger, not from center. The default `transform-origin: center` is wrong for almost every popover. **Exception: modals.** Modals should keep `transform-origin: center` because they are not anchored to a specific trigger — they appear centered in the viewport.

```css
/* Radix UI */
.popover {
  transform-origin: var(--radix-popover-content-transform-origin);
}

/* Base UI */
.popover {
  transform-origin: var(--transform-origin);
}
```

Whether the user notices the difference individually does not matter. In the aggregate, unseen details become visible. They compound.

### Tooltips: skip delay on subsequent hovers

Tooltips should delay before appearing to prevent accidental activation. But once one tooltip is open, hovering over adjacent tooltips should open them instantly with no animation. This feels faster without defeating the purpose of the initial delay.

```css
.tooltip {
  transition: transform 125ms ease-out, opacity 125ms ease-out;
  transform-origin: var(--transform-origin);
}

.tooltip[data-starting-style],
.tooltip[data-ending-style] {
  opacity: 0;
  transform: scale(0.97);
}

/* Skip animation on subsequent tooltips */
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

### Use CSS transitions over keyframes for interruptible UI

CSS transitions can be interrupted and retargeted mid-animation. Keyframes restart from zero. For any interaction that can be triggered rapidly (adding toasts, toggling states), transitions produce smoother results.

```css
/* Interruptible - good for UI */
.toast {
  transition: transform 400ms ease;
}

/* Not interruptible - avoid for dynamic UI */
@keyframes slideIn {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

### Use blur to mask imperfect transitions

When a crossfade between two states feels off despite trying different easings and durations, add subtle `filter: blur(2px)` during the transition.

**Why blur works:** Without blur, you see two distinct objects during a crossfade — the old state and the new state overlapping. This looks unnatural. Blur bridges the visual gap by blending the two states together, tricking the eye into perceiving a single smooth transformation instead of two objects swapping.

Combine blur with scale-on-press (`scale(0.97)`) for a polished button state transition:

```css
.button {
  transition: transform 160ms ease-out;
}

.button:active {
  transform: scale(0.97);
}

.button-content {
  transition: filter 200ms ease, opacity 200ms ease;
}

.button-content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
}
```

Keep blur under 20px. Heavy blur is expensive, especially in Safari.

### Animate enter states with @starting-style

The modern CSS way to animate element entry without JavaScript:

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;

  @starting-style {
    opacity: 0;
    transform: translateY(100%);
  }
}
```

This replaces the common React pattern of using `useEffect` to set `mounted: true` after initial render. Use `@starting-style` when browser support allows; fall back to the `data-mounted` attribute pattern otherwise.

```jsx
// Legacy pattern (still works everywhere)
useEffect(() => {
  setMounted(true);
}, []);
// <div data-mounted={mounted}>
```

## CSS Transform Mastery

### translateY with percentages

Percentage values in `translate()` are relative to the element's own size. Use `translateY(100%)` to move an element by its own height, regardless of actual dimensions. This is how Sonner positions toasts and how Vaul hides the drawer before animating in.

```css
/* Works regardless of drawer height */
.drawer-hidden {
  transform: translateY(100%);
}

/* Works regardless of toast height */
.toast-enter {
  transform: translateY(-100%);
}
```

Prefer percentages over hardcoded pixel values. They are less error-prone and adapt to content.

### scale() scales children too

Unlike `width`/`height`, `scale()` also scales an element's children. When scaling a button on press, the font size, icons, and content scale proportionally. This is a feature, not a bug.

### 3D transforms for depth

`rotateX()`, `rotateY()` with `transform-style: preserve-3d` create real 3D effects in CSS. Orbiting animations, coin flips, and depth effects are all possible without JavaScript.

```css
.wrapper {
  transform-style: preserve-3d;
}

@keyframes orbit {
  from {
    transform: translate(-50%, -50%) rotateY(0deg) translateZ(72px) rotateY(360deg);
  }
  to {
    transform: translate(-50%, -50%) rotateY(360deg) translateZ(72px) rotateY(0deg);
  }
}
```

### transform-origin

Every element has an anchor point from which transforms execute. The default is center. Set it to match where the trigger lives for origin-aware interactions.

## clip-path for Animation

`clip-path` is not just for shapes. It is one of the most powerful animation tools in CSS.

### The inset shape

`clip-path: inset(top right bottom left)` defines a rectangular clipping region. Each value "eats" into the element from that side.

```css
/* Fully hidden from right */
.hidden {
  clip-path: inset(0 100% 0 0);
}

/* Fully visible */
.visible {
  clip-path: inset(0 0 0 0);
}

/* Reveal from left to right */
.overlay {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 200ms ease-out;
}
.button:active .overlay {
  clip-path: inset(0 0 0 0);
  transition: clip-path 2s linear;
}
```

### Tabs with perfect color transitions

Duplicate the tab list. Style the copy as "active" (different background, different text color). Clip the copy so only the active tab is visible. Animate the clip on tab change. This creates a seamless color transition that timing individual color transitions can never achieve.

### Hold-to-delete pattern

Use `clip-path: inset(0 100% 0 0)` on a colored overlay. On `:active`, transition to `inset(0 0 0 0)` over 2s with linear timing. On release, snap back with 200ms ease-out. Add `scale(0.97)` on the button for press feedback.

### Image reveals on scroll

Start with `clip-path: inset(0 0 100% 0)` (hidden from bottom). Animate to `inset(0 0 0 0)` when the element enters the viewport. Use `IntersectionObserver` or Framer Motion's `useInView` with `{ once: true, margin: "-100px" }`.

### Comparison sliders

Overlay two images. Clip the top one with `clip-path: inset(0 50% 0 0)`. Adjust the right inset value based on drag position. No extra DOM elements needed, fully hardware-accelerated.

## Gesture and Drag Interactions

### Momentum-based dismissal

Don't require dragging past a threshold. Calculate velocity: `Math.abs(dragDistance) / elapsedTime`. If velocity exceeds ~0.11, dismiss regardless of distance. A quick flick should be enough.

```js
const timeTaken = new Date().getTime() - dragStartTime.current.getTime();
const velocity = Math.abs(swipeAmount) / timeTaken;

if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
  dismiss();
}
```

### Damping at boundaries

When a user drags past the natural boundary (e.g., dragging a drawer up when already at top), apply damping. The more they drag, the less the element moves. Things in real life don't suddenly stop; they slow down first.

### Pointer capture for drag

Once dragging starts, set the element to capture all pointer events. This ensures dragging continues even if the pointer leaves the element bounds.

### Multi-touch protection

Ignore additional touch points after the initial drag begins. Without this, switching fingers mid-drag causes the element to jump to the new position.

```js
function onPress() {
  if (isDragging) return;
  // Start drag...
}
```

### Friction instead of hard stops

Instead of preventing upward drag entirely, allow it with increasing friction. It feels more natural than hitting an invisible wall.

## Performance Rules

### Only animate transform and opacity

These properties skip layout and paint, running on the GPU. Animating `padding`, `margin`, `height`, or `width` triggers all three rendering steps.

### CSS variables are inheritable

Changing a CSS variable on a parent recalculates styles for all children. In a drawer with many items, updating `--swipe-amount` on the container causes expensive style recalculation. Update `transform` directly on the element instead.

```js
// Bad: triggers recalc on all children
element.style.setProperty('--swipe-amount', `${distance}px`);

// Good: only affects this element
element.style.transform = `translateY(${distance}px)`;
```

### Framer Motion hardware acceleration caveat

Framer Motion's shorthand properties (`x`, `y`, `scale`) are NOT hardware-accelerated. They use `requestAnimationFrame` on the main thread. For hardware acceleration, use the full `transform` string:

```jsx
// NOT hardware accelerated (convenient but drops frames under load)
<motion.div animate={{ x: 100 }} />

// Hardware accelerated (stays smooth even when main thread is busy)
<motion.div animate={{ transform: "translateX(100px)" }} />
```

This matters when the browser is simultaneously loading content, running scripts, or painting. At Vercel, the dashboard tab animation used Shared Layout Animations and dropped frames during page loads. Switching to CSS animations (off main thread) fixed it.

### CSS animations beat JS under load

CSS animations run off the main thread. When the browser is busy loading a new page, Framer Motion animations (using `requestAnimationFrame`) drop frames. CSS animations remain smooth. Use CSS for predetermined animations; JS for dynamic, interruptible ones.

### Use WAAPI for programmatic CSS animations

The Web Animations API gives you JavaScript control with CSS performance. Hardware-accelerated, interruptible, and no library needed.

```js
element.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
  duration: 1000,
  fill: 'forwards',
  easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
});
```

## Accessibility

### prefers-reduced-motion

Animations can cause motion sickness. Reduced motion means fewer and gentler animations, not zero. Keep opacity and color transitions that aid comprehension. Remove movement and position animations.

```css
@media (prefers-reduced-motion: reduce) {
  .element {
    animation: fade 0.2s ease;
    /* No transform-based motion */
  }
}
```

```jsx
const shouldReduceMotion = useReducedMotion();
const closedX = shouldReduceMotion ? 0 : '-100%';
```

### Touch device hover states

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover {
    transform: scale(1.05);
  }
}
```

Touch devices trigger hover on tap, causing false positives. Gate hover animations behind this media query.

## The Sonner Principles (Building Loved Components)

These principles come from building Sonner (13M+ weekly npm downloads) and apply to any component:

1. **Developer experience is key.** No hooks, no context, no complex setup. Insert `<Toaster />` once, call `toast()` from anywhere. The less friction to adopt, the more people will use it.

2. **Good defaults matter more than options.** Ship beautiful out of the box. Most users never customize. The default easing, timing, and visual design should be excellent.

3. **Naming creates identity.** "Sonner" (French for "to ring") feels more elegant than "react-toast". Sacrifice discoverability for memorability when appropriate.

4. **Handle edge cases invisibly.** Pause toast timers when the tab is hidden. Fill gaps between stacked toasts with pseudo-elements to maintain hover state. Capture pointer events during drag. Users never notice these, and that is exactly right.

5. **Use transitions, not keyframes, for dynamic UI.** Toasts are added rapidly. Keyframes restart from zero on interruption. Transitions retarget smoothly.

6. **Build a great documentation site.** Let people touch the product, play with it, and understand it before they use it. Interactive examples with ready-to-use code snippets lower the barrier to adoption.

### Cohesion matters

Sonner's animation feels satisfying partly because the whole experience is cohesive. The easing and duration fit the vibe of the library. It is slightly slower than typical UI animations and uses `ease` rather than `ease-out` to feel more elegant. The animation style matches the toast design, the page design, the name — everything is in harmony.

When choosing animation values, consider the personality of the component. A playful component can be bouncier. A professional dashboard should be crisp and fast. Match the motion to the mood.

### The opacity + height combination

When items enter and exit a list (like Family's drawer), the opacity change must work well with the height animation. This is often trial and error. There is no formula — you adjust until it feels right.

### Review your work the next day

Review animations with fresh eyes. You notice imperfections the next day that you missed during development. Play animations in slow motion or frame by frame to spot timing issues that are invisible at full speed.

### Asymmetric enter/exit timing

Pressing should be slow when it needs to be deliberate (hold-to-delete: 2s linear), but release should always be snappy (200ms ease-out). This pattern applies broadly: slow where the user is deciding, fast where the system is responding.

```css
/* Release: fast */
.overlay {
  transition: clip-path 200ms ease-out;
}

/* Press: slow and deliberate */
.button:active .overlay {
  transition: clip-path 2s linear;
}
```

## Stagger Animations

When multiple elements enter together, stagger their appearance. Each element animates in with a small delay after the previous one. This creates a cascading effect that feels more natural than everything appearing at once.

```css
.item {
  opacity: 0;
  transform: translateY(8px);
  animation: fadeIn 300ms ease-out forwards;
}

.item:nth-child(1) {
  animation-delay: 0ms;
}
.item:nth-child(2) {
  animation-delay: 50ms;
}
.item:nth-child(3) {
  animation-delay: 100ms;
}
.item:nth-child(4) {
  animation-delay: 150ms;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Keep stagger delays short (30-80ms between items). Long delays make the interface feel slow. Stagger is decorative — never block interaction while stagger animations are playing.

## Debugging Animations

### Slow motion testing

Play animations at reduced speed to spot issues invisible at full speed. Temporarily increase duration to 2-5x normal, or use browser DevTools animation inspector to slow playback.

Things to look for in slow motion:

- Do colors transition smoothly, or do you see two distinct states overlapping?
- Does the easing feel right, or does it start/stop abruptly?
- Is the transform-origin correct, or does the element scale from the wrong point?
- Are multiple animated properties (opacity, transform, color) in sync?

### Frame-by-frame inspection

Step through animations frame by frame in Chrome DevTools (Animations panel). This reveals timing issues between coordinated properties that you cannot see at full speed.

### Test on real devices

For touch interactions (drawers, swipe gestures), test on physical devices. Connect your phone via USB, visit your local dev server by IP address, and use Safari's remote devtools. The Xcode Simulator is an alternative but real hardware is better for gesture testing.

## Review Checklist

When reviewing UI code, check for:

| Issue                                      | Fix                                                              |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `transition: all`                          | Specify exact properties: `transition: transform 200ms ease-out` |
| `scale(0)` entry animation                 | Start from `scale(0.95)` with `opacity: 0`                       |
| `ease-in` on UI element                    | Switch to `ease-out` or custom curve                             |
| `transform-origin: center` on popover      | Set to trigger location or use Radix/Base UI CSS variable (modals are exempt — keep centered) |
| Animation on keyboard action               | Remove animation entirely                                        |
| Duration > 300ms on UI element             | Reduce to 150-250ms                                              |
| Hover animation without media query        | Add `@media (hover: hover) and (pointer: fine)`                  |
| Keyframes on rapidly-triggered element     | Use CSS transitions for interruptibility                         |
| Framer Motion `x`/`y` props under load     | Use `transform: "translateX()"` for hardware acceleration        |
| Same enter/exit transition speed           | Make exit faster than enter (e.g., enter 2s, exit 200ms)         |
| Elements all appear at once                | Add stagger delay (30-80ms between items)                        |

### Marketing Psychology & Mental Models

---

name: marketing-psychology
description: "When the user wants to apply psychological principles, mental models, or behavioral science to marketing. Also use when the user mentions 'psychology,' 'mental models,' 'cognitive bias,' 'persuasion,' 'behavioral science,' 'why people buy,' 'decision-making,' 'consumer behavior,' 'anchoring,' 'social proof,' 'scarcity,' 'loss aversion,' 'framing,' or 'nudge.' Use this whenever someone wants to understand or leverage how people think and make decisions in a marketing context. For applying psychology to specific pages, see cro; for pricing tactics, see pricing; for copy framing, see copywriting."
metadata:
  version: 2.0.0
keywords: ux-design, best-practices, behavioral-science, consumer-behavior, psychology, conversion-optimization, strategy
---

# Marketing Psychology & Mental Models

You are an expert in applying psychological principles and mental models to marketing. Your goal is to help users understand why people buy, how to influence behavior ethically, and how to make better marketing decisions.

## How to Use This Skill

**Check for product marketing context first:**
If `.agents/product-marketing.md` exists (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md` filename, in older setups), read it before applying mental models. Use that context to tailor recommendations to the specific product and audience.

Mental models are thinking tools that help you make better decisions, understand customer behavior, and create more effective marketing. When helping users:

1. Identify which mental models apply to their situation
2. Explain the psychology behind the model
3. Provide specific marketing applications
4. Suggest how to implement ethically

---

## Foundational Thinking Models

These models sharpen your strategy and help you solve the right problems.

### First Principles

Break problems down to basic truths and build solutions from there. Instead of copying competitors, ask "why" repeatedly to find root causes. Use the 5 Whys technique to tunnel down to what really matters.

**Marketing application**: Don't assume you need content marketing because competitors do. Ask why you need it, what problem it solves, and whether there's a better solution.

### Jobs to Be Done

People don't buy products—they "hire" them to get a job done. Focus on the outcome customers want, not features.

**Marketing application**: A drill buyer doesn't want a drill—they want a hole. Frame your product around the job it accomplishes, not its specifications.

### Circle of Competence

Know what you're good at and stay within it. Venture outside only with proper learning or expert help.

**Marketing application**: Don't chase every channel. Double down where you have genuine expertise and competitive advantage.

### Inversion

Instead of asking "How do I succeed?", ask "What would guarantee failure?" Then avoid those things.

**Marketing application**: List everything that would make your campaign fail—confusing messaging, wrong audience, slow landing page—then systematically prevent each.

### Occam's Razor

The simplest explanation is usually correct. Avoid overcomplicating strategies or attributing results to complex causes when simple ones suffice.

**Marketing application**: If conversions dropped, check the obvious first (broken form, page speed) before assuming complex attribution issues.

### Pareto Principle (80/20 Rule)

Roughly 80% of results come from 20% of efforts. Identify and focus on the vital few.

**Marketing application**: Find the 20% of channels, customers, or content driving 80% of results. Cut or reduce the rest.

### Local vs. Global Optima

A local optimum is the best solution nearby, but a global optimum is the best overall. Don't get stuck optimizing the wrong thing.

**Marketing application**: Optimizing email subject lines (local) won't help if email isn't the right channel (global). Zoom out before zooming in.

### Theory of Constraints

Every system has one bottleneck limiting throughput. Find and fix that constraint before optimizing elsewhere.

**Marketing application**: If your funnel converts well but traffic is low, more conversion optimization won't help. Fix the traffic bottleneck first.

### Opportunity Cost

Every choice has a cost—what you give up by not choosing alternatives. Consider what you're saying no to.

**Marketing application**: Time spent on a low-ROI channel is time not spent on high-ROI activities. Always compare against alternatives.

### Law of Diminishing Returns

After a point, additional investment yields progressively smaller gains.

**Marketing application**: The 10th blog post won't have the same impact as the first. Know when to diversify rather than double down.

### Second-Order Thinking

Consider not just immediate effects, but the effects of those effects.

**Marketing application**: A flash sale boosts revenue (first order) but may train customers to wait for discounts (second order).

### Map ≠ Territory

Models and data represent reality but aren't reality itself. Don't confuse your analytics dashboard with actual customer experience.

**Marketing application**: Your customer persona is a useful model, but real customers are more complex. Stay in touch with actual users.

### Probabilistic Thinking

Think in probabilities, not certainties. Estimate likelihoods and plan for multiple outcomes.

**Marketing application**: Don't bet everything on one campaign. Spread risk and plan for scenarios where your primary strategy underperforms.

### Barbell Strategy

Combine extreme safety with small high-risk/high-reward bets. Avoid the mediocre middle.

**Marketing application**: Put 80% of budget into proven channels, 20% into experimental bets. Avoid moderate-risk, moderate-reward middle.

---

## Understanding Buyers & Human Psychology

These models explain how customers think, decide, and behave.

### Fundamental Attribution Error

People attribute others' behavior to character, not circumstances. "They didn't buy because they're not serious" vs. "The checkout was confusing."

**Marketing application**: When customers don't convert, examine your process before blaming them. The problem is usually situational, not personal.

### Mere Exposure Effect

People prefer things they've seen before. Familiarity breeds liking.

**Marketing application**: Consistent brand presence builds preference over time. Repetition across channels creates comfort and trust.

### Availability Heuristic

People judge likelihood by how easily examples come to mind. Recent or vivid events seem more common.

**Marketing application**: Case studies and testimonials make success feel more achievable. Make positive outcomes easy to imagine.

### Confirmation Bias

People seek information confirming existing beliefs and ignore contradictory evidence.

**Marketing application**: Understand what your audience already believes and align messaging accordingly. Fighting beliefs head-on rarely works.

### The Lindy Effect

The longer something has survived, the longer it's likely to continue. Old ideas often outlast new ones.

**Marketing application**: Proven marketing principles (clear value props, social proof) outlast trendy tactics. Don't abandon fundamentals for fads.

### Mimetic Desire

People want things because others want them. Desire is socially contagious.

**Marketing application**: Show that desirable people want your product. Waitlists, exclusivity, and social proof trigger mimetic desire.

### Sunk Cost Fallacy

People continue investing in something because of past investment, even when it's no longer rational.

**Marketing application**: Know when to kill underperforming campaigns. Past spend shouldn't justify future spend if results aren't there.

### Endowment Effect

People value things more once they own them.

**Marketing application**: Free trials, samples, and freemium models let customers "own" the product, making them reluctant to give it up.

### IKEA Effect

People value things more when they've put effort into creating them.

**Marketing application**: Let customers customize, configure, or build something. Their investment increases perceived value and commitment.

### Zero-Price Effect

Free isn't just a low price—it's psychologically different. "Free" triggers irrational preference.

**Marketing application**: Free tiers, free trials, and free shipping have disproportionate appeal. The jump from $1 to $0 is bigger than $2 to $1.

### Hyperbolic Discounting / Present Bias

People strongly prefer immediate rewards over future ones, even when waiting is more rational.

**Marketing application**: Emphasize immediate benefits ("Start saving time today") over future ones ("You'll see ROI in 6 months").

### Status-Quo Bias

People prefer the current state of affairs. Change requires effort and feels risky.

**Marketing application**: Reduce friction to switch. Make the transition feel safe and easy. "Import your data in one click."

### Default Effect

People tend to accept pre-selected options. Defaults are powerful.

**Marketing application**: Pre-select the plan you want customers to choose. Opt-out beats opt-in for subscriptions (ethically applied).

### Paradox of Choice

Too many options overwhelm and paralyze. Fewer choices often lead to more decisions.

**Marketing application**: Limit options. Three pricing tiers beat seven. Recommend a single "best for most" option.

### Goal-Gradient Effect

People accelerate effort as they approach a goal. Progress visualization motivates action.

**Marketing application**: Show progress bars, completion percentages, and "almost there" messaging to drive completion.

### Peak-End Rule

People judge experiences by the peak (best or worst moment) and the end, not the average.

**Marketing application**: Design memorable peaks (surprise upgrades, delightful moments) and strong endings (thank you pages, follow-up emails).

### Zeigarnik Effect

Unfinished tasks occupy the mind more than completed ones. Open loops create tension.

**Marketing application**: "You're 80% done" creates pull to finish. Incomplete profiles, abandoned carts, and cliffhangers leverage this.

### Pratfall Effect

Competent people become more likable when they show a small flaw. Perfection is less relatable.

**Marketing application**: Admitting a weakness ("We're not the cheapest, but...") can increase trust and differentiation.

### Curse of Knowledge

Once you know something, you can't imagine not knowing it. Experts struggle to explain simply.

**Marketing application**: Your product seems obvious to you but confusing to newcomers. Test copy with people unfamiliar with your space.

### Mental Accounting

People treat money differently based on its source or intended use, even though money is fungible.

**Marketing application**: Frame costs in favorable mental accounts. "$3/day" feels different than "$90/month" even though it's the same.

### Regret Aversion

People avoid actions that might cause regret, even if the expected outcome is positive.

**Marketing application**: Address regret directly. Money-back guarantees, free trials, and "no commitment" messaging reduce regret fear.

### Bandwagon Effect / Social Proof

People follow what others are doing. Popularity signals quality and safety.

**Marketing application**: Show customer counts, testimonials, logos, reviews, and "trending" indicators. Numbers create confidence.

---

## Influencing Behavior & Persuasion

These models help you ethically influence customer decisions.

### Reciprocity Principle

People feel obligated to return favors. Give first, and people want to give back.

**Marketing application**: Free content, free tools, and generous free tiers create reciprocal obligation. Give value before asking for anything.

### Commitment & Consistency

Once people commit to something, they want to stay consistent with that commitment.

**Marketing application**: Get small commitments first (email signup, free trial). People who've taken one step are more likely to take the next.

### Authority Bias

People defer to experts and authority figures. Credentials and expertise create trust.

**Marketing application**: Feature expert endorsements, certifications, "featured in" logos, and thought leadership content.

### Liking / Similarity Bias

People say yes to those they like and those similar to themselves.

**Marketing application**: Use relatable spokespeople, founder stories, and community language. "Built by marketers for marketers" signals similarity.

### Unity Principle

Shared identity drives influence. "One of us" is powerful.

**Marketing application**: Position your brand as part of the customer's tribe. Use insider language and shared values.

### Scarcity / Urgency Heuristic

Limited availability increases perceived value. Scarcity signals desirability.

**Marketing application**: Limited-time offers, low-stock warnings, and exclusive access create urgency. Only use when genuine.

### Foot-in-the-Door Technique

Start with a small request, then escalate. Compliance with small requests leads to compliance with larger ones.

**Marketing application**: Free trial → paid plan → annual plan → enterprise. Each step builds on the last.

### Door-in-the-Face Technique

Start with an unreasonably large request, then retreat to what you actually want. The contrast makes the second request seem reasonable.

**Marketing application**: Show enterprise pricing first, then reveal the affordable starter plan. The contrast makes it feel like a deal.

### Loss Aversion / Prospect Theory

Losses feel roughly twice as painful as equivalent gains feel good. People will work harder to avoid losing than to gain.

**Marketing application**: Frame in terms of what they'll lose by not acting. "Don't miss out" beats "You could gain."

### Anchoring Effect

The first number people see heavily influences subsequent judgments.

**Marketing application**: Show the higher price first (original price, competitor price, enterprise tier) to anchor expectations.

### Decoy Effect

Adding a third, inferior option makes one of the original two look better.

**Marketing application**: A "decoy" pricing tier that's clearly worse value makes your preferred tier look like the obvious choice.

### Framing Effect

How something is presented changes how it's perceived. Same facts, different frames.

**Marketing application**: "90% success rate" vs. "10% failure rate" are identical but feel different. Frame positively.

### Contrast Effect

Things seem different depending on what they're compared to.

**Marketing application**: Show the "before" state clearly. The contrast with your "after" makes improvements vivid.

---

## Pricing Psychology

These models specifically address how people perceive and respond to prices.

### Charm Pricing / Left-Digit Effect

Prices ending in 9 seem significantly lower than the next round number. $99 feels much cheaper than $100.

**Marketing application**: Use .99 or .95 endings for value-focused products. The left digit dominates perception.

### Rounded-Price (Fluency) Effect

Round numbers feel premium and are easier to process. $100 signals quality; $99 signals value.

**Marketing application**: Use round prices for premium products ($500/month), charm prices for value products ($497/month).

### Rule of 100

For prices under $100, percentage discounts seem larger ("20% off"). For prices over $100, absolute discounts seem larger ("$50 off").

**Marketing application**: $80 product: "20% off" beats "$16 off." $500 product: "$100 off" beats "20% off."

### Price Relativity / Good-Better-Best

People judge prices relative to options presented. A middle tier seems reasonable between cheap and expensive.

**Marketing application**: Three tiers where the middle is your target. The expensive tier makes it look reasonable; the cheap tier provides an anchor.

### Mental Accounting (Pricing)

Framing the same price differently changes perception.

**Marketing application**: "$1/day" feels cheaper than "$30/month." "Less than your morning coffee" reframes the expense.

---

## Design & Delivery Models

These models help you design effective marketing systems.

### Hick's Law

Decision time increases with the number and complexity of choices. More options = slower decisions = more abandonment.

**Marketing application**: Simplify choices. One clear CTA beats three. Fewer form fields beat more.

### AIDA Funnel

Attention → Interest → Desire → Action. The classic customer journey model.

**Marketing application**: Structure pages and campaigns to move through each stage. Capture attention before building desire.

### Rule of 7

Prospects need roughly 7 touchpoints before converting. One ad rarely converts; sustained presence does.

**Marketing application**: Build multi-touch campaigns across channels. Retargeting, email sequences, and consistent presence compound.

### Nudge Theory / Choice Architecture

Small changes in how choices are presented significantly influence decisions.

**Marketing application**: Default selections, strategic ordering, and friction reduction guide behavior without restricting choice.

### BJ Fogg Behavior Model

Behavior = Motivation × Ability × Prompt. All three must be present for action.

**Marketing application**: High motivation but hard to do = won't happen. Easy to do but no prompt = won't happen. Design for all three.

### EAST Framework

Make desired behaviors: Easy, Attractive, Social, Timely.

**Marketing application**: Reduce friction (easy), make it appealing (attractive), show others doing it (social), ask at the right moment (timely).

### COM-B Model

Behavior requires: Capability, Opportunity, Motivation.

**Marketing application**: Can they do it (capability)? Is the path clear (opportunity)? Do they want to (motivation)? Address all three.

### Activation Energy

The initial energy required to start something. High activation energy prevents action even if the task is easy overall.

**Marketing application**: Reduce starting friction. Pre-fill forms, offer templates, show quick wins. Make the first step trivially easy.

### North Star Metric

One metric that best captures the value you deliver to customers. Focus creates alignment.

**Marketing application**: Identify your North Star (active users, completed projects, revenue per customer) and align all efforts toward it.

### The Cobra Effect

When incentives backfire and produce the opposite of intended results.

**Marketing application**: Test incentive structures. A referral bonus might attract low-quality referrals gaming the system.

---

## Growth & Scaling Models

These models explain how marketing compounds and scales.

### Feedback Loops

Output becomes input, creating cycles. Positive loops accelerate growth; negative loops create decline.

**Marketing application**: Build virtuous cycles: more users → more content → better SEO → more users. Identify and strengthen positive loops.

### Compounding

Small, consistent gains accumulate into large results over time. Early gains matter most.

**Marketing application**: Consistent content, SEO, and brand building compound. Start early; benefits accumulate exponentially.

### Network Effects

A product becomes more valuable as more people use it.

**Marketing application**: Design features that improve with more users: shared workspaces, integrations, marketplaces, communities.

### Flywheel Effect

Sustained effort creates momentum that eventually maintains itself. Hard to start, easy to maintain.

**Marketing application**: Content → traffic → leads → customers → case studies → more content. Each element powers the next.

### Switching Costs

The price (time, money, effort, data) of changing to a competitor. High switching costs create retention.

**Marketing application**: Increase switching costs ethically: integrations, data accumulation, workflow customization, team adoption.

### Exploration vs. Exploitation

Balance trying new things (exploration) with optimizing what works (exploitation).

**Marketing application**: Don't abandon working channels for shiny new ones, but allocate some budget to experiments.

### Critical Mass / Tipping Point

The threshold after which growth becomes self-sustaining.

**Marketing application**: Focus resources on reaching critical mass in one segment before expanding. Depth before breadth.

### Survivorship Bias

Focusing on successes while ignoring failures that aren't visible.

**Marketing application**: Study failed campaigns, not just successful ones. The viral hit you're copying had 99 failures you didn't see.

---

## Quick Reference

When facing a marketing challenge, consider:

| Challenge | Relevant Models |
|-----------|-----------------|
| Low conversions | Hick's Law, Activation Energy, BJ Fogg, Friction |
| Price objections | Anchoring, Framing, Mental Accounting, Loss Aversion |
| Building trust | Authority, Social Proof, Reciprocity, Pratfall Effect |
| Increasing urgency | Scarcity, Loss Aversion, Zeigarnik Effect |
| Retention/churn | Endowment Effect, Switching Costs, Status-Quo Bias |
| Growth stalling | Theory of Constraints, Local vs Global Optima, Compounding |
| Decision paralysis | Paradox of Choice, Default Effect, Nudge Theory |
| Onboarding | Goal-Gradient, IKEA Effect, Commitment & Consistency |

---

## Task-Specific Questions

1. What specific behavior are you trying to influence?
2. What does your customer believe before encountering your marketing?
3. Where in the journey (awareness → consideration → decision) is this?
4. What's currently preventing the desired action?
5. Have you tested this with real customers?

---

## Related Skills

- **cro**: Apply psychology to page optimization
- **copywriting**: Write copy using psychological principles
- **popups**: Use triggers and psychology in popups
- **pricing-page optimization**: See cro for pricing psychology
- **ab-testing**: Test psychological hypotheses

### Frontend Design for Distinctive Interfaces

---

name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
keywords: web-design, ui-design, ux-design, visual-design, typography, color, layout, animation
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision." />
    <title>React Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
