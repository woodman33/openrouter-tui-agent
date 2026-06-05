@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #0a0a0c;
  --panel: #0ف;
  --panel: #0e0e12;
  --panel-2: #131318;
  --border: #1f1f26;
  --border-soft: #18181d;
  --text: #e6e6ea;
  --text-dim: #8a8a94;
  --text-faint: #565660;
  --proof: #4f9cff;
  --verified: #43d6a0;
  --action: #f5b545;
  --agent: #a98bff;

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --font-mono: "JetBrains Mono", "SF Mono", ui-monospace, "Cascadia Code",
    Menlo, Consolas, monospace;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

html,
body,
# root {
  height: 100%;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow: hidden;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #26262e;
  border-radius: 8px;
}
::-webkit-scrollbar-thumb:hover {
  background: #34343e;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input,
textarea {
  font-family: inherit;
}

iconify-icon {
  display: inline-block;
  line-height: 1;
}

.tt-grain::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255, 255, 255, 0.015) 1px,
    transparent 0
  );
  background-size: 22px 22px;
  z-index: 1;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.tt-caret {
  display: inline-block;
  width: 8px;
  background: var(--agent);
  margin-left: 2px;
  animation: blink 1s steps(1) infinite;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
