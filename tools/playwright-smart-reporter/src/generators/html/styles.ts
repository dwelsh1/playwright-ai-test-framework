import { generateTraceViewerStyles } from '../trace-viewer-generator';

/**
 * Generate all CSS styles for the new app-shell layout
 */
export function generateStyles(passRate: number, cspSafe: boolean = false): string {
  // Font families - use system fonts in CSP-safe mode
  const primaryFont = cspSafe
    ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    : "'Space Grotesk', system-ui, sans-serif";
  const monoFont = cspSafe
    ? "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    : "'JetBrains Mono', ui-monospace, monospace";

  return `    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a24;
      --bg-card-hover: #22222e;
      --bg-sidebar: #0d0d14;
      --border-subtle: #2a2a3a;
      --border-glow: #3b3b4f;
      --text-primary: #f0f0f5;
      --text-secondary: #8888a0;
      --text-muted: #5a5a70;
      --accent-green: #00ff88;
      --accent-green-dim: #00cc6a;
      --accent-red: #ff4466;
      --accent-red-dim: #cc3355;
      --accent-yellow: #ffcc00;
      --accent-yellow-dim: #ccaa00;
      --accent-blue: #00aaff;
      --accent-blue-dim: #0088cc;
      --accent-purple: #aa66ff;
      --accent-orange: #ff8844;
      --sidebar-width: 260px;
      --topbar-height: 56px;
    }

    /* Light theme - respects system preference */
    @media (prefers-color-scheme: light) {
      :root:not([data-theme="dark"]) {
        --bg-primary: #f5f5f7;
        --bg-secondary: #ffffff;
        --bg-card: #ffffff;
        --bg-card-hover: #f0f0f2;
        --bg-sidebar: #fafafa;
        --border-subtle: #e0e0e5;
        --border-glow: #d0d0d8;
        --text-primary: #1a1a1f;
        --text-secondary: #5a5a6e;
        --text-muted: #8a8a9a;
        --accent-green: #00aa55;
        --accent-green-dim: #008844;
        --accent-red: #dd3344;
        --accent-red-dim: #bb2233;
        --accent-yellow: #cc9900;
        --accent-yellow-dim: #aa7700;
        --accent-blue: #0077cc;
        --accent-blue-dim: #005599;
        --accent-purple: #8844cc;
        --accent-orange: #dd6622;
      }
    }

    /* Manual dark theme override */
    :root[data-theme="dark"] {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a24;
      --bg-card-hover: #22222e;
      --bg-sidebar: #0d0d14;
      --border-subtle: #2a2a3a;
      --border-glow: #3b3b4f;
      --text-primary: #f0f0f5;
      --text-secondary: #8888a0;
      --text-muted: #5a5a70;
      --accent-green: #00ff88;
      --accent-green-dim: #00cc6a;
      --accent-red: #ff4466;
      --accent-red-dim: #cc3355;
      --accent-yellow: #ffcc00;
      --accent-yellow-dim: #ccaa00;
      --accent-blue: #00aaff;
      --accent-blue-dim: #0088cc;
      --accent-purple: #aa66ff;
      --accent-orange: #ff8844;
    }

    /* Manual light theme override */
    :root[data-theme="light"] {
      --bg-primary: #f5f5f7;
      --bg-secondary: #ffffff;
      --bg-card: #ffffff;
      --bg-card-hover: #f0f0f2;
      --bg-sidebar: #fafafa;
      --border-subtle: #e0e0e5;
      --border-glow: #d0d0d8;
      --text-primary: #1a1a1f;
      --text-secondary: #5a5a6e;
      --text-muted: #8a8a9a;
      --accent-green: #00aa55;
      --accent-green-dim: #008844;
      --accent-red: #dd3344;
      --accent-red-dim: #bb2233;
      --accent-yellow: #cc9900;
      --accent-yellow-dim: #aa7700;
      --accent-blue: #0077cc;
      --accent-blue-dim: #005599;
      --accent-purple: #8844cc;
      --accent-orange: #dd6622;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    button {
      background: none;
      border: none;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    body {
      font-family: ${primaryFont};
      background: var(--bg-primary);
      color: var(--text-primary);
      height: 100vh;
      overflow: hidden;
      line-height: 1.5;
    }

    /* ============================================
       APP SHELL LAYOUT
    ============================================ */
    .app-shell {
      display: grid;
      grid-template-areas:
        "topbar topbar"
        "sidebar main"
        "footer footer";
      grid-template-columns: var(--sidebar-width) 1fr;
      grid-template-rows: var(--topbar-height) 1fr auto;
      height: 100vh;
      overflow: hidden;
      transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .app-shell.sidebar-collapsed {
      grid-template-columns: 0 1fr;
    }

    .app-shell.sidebar-collapsed .sidebar {
      transform: translateX(-100%);
      opacity: 0;
    }

    /* ============================================
       TOP BAR
    ============================================ */
    .top-bar {
      grid-area: topbar;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-subtle);
      z-index: 100;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }

    .sidebar-toggle:hover {
      background: var(--bg-card);
      border-color: var(--border-glow);
      color: var(--text-primary);
    }

    .hamburger-icon {
      font-size: 1.1rem;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent-green) 0%, var(--accent-blue) 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
      color: var(--bg-primary);
    }

    .logo-icon-img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .logo-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .logo-subtitle {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-family: ${monoFont};
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: 1rem;
      padding-left: 1rem;
      border-left: 1px solid var(--border-subtle);
    }

    .breadcrumb {
      font-size: 0.85rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.2s;
    }

    .breadcrumb:hover { color: var(--text-secondary); }
    .breadcrumb.active { color: var(--text-primary); font-weight: 500; }

    .breadcrumb-separator {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .search-trigger {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
      min-width: 200px;
    }

    .search-trigger:hover {
      border-color: var(--border-glow);
      color: var(--text-secondary);
    }

    .search-icon-btn { font-size: 0.85rem; }
    .search-label { flex: 1; text-align: left; font-size: 0.85rem; }
    .search-kbd {
      font-family: ${monoFont};
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-muted);
    }

    .top-bar-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: ${monoFont};
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .top-bar-btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    .btn-label { font-size: 0.8rem; }

    .timestamp {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
      padding: 0.4rem 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
    }

    /* ============================================
       SIDEBAR
    ============================================ */
    .sidebar {
      grid-area: sidebar;
      display: flex;
      flex-direction: column;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      min-height: 0; /* Allow grid cell to shrink below content height */
      overflow-y: auto;
      overflow-x: hidden;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }

    /* Hidden by default on desktop */
    .sidebar-overlay {
      display: none;
    }

    .sidebar-progress {
      padding: 1.25rem;
      text-align: center;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .progress-ring-container {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto;
    }

    .progress-ring-container.clickable {
      cursor: pointer;
      transition: transform 0.2s, filter 0.2s;
    }

    .progress-ring-container.clickable:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }

    .progress-ring {
      transform: rotate(-90deg);
    }

    .progress-ring-bg {
      fill: none;
      stroke: var(--border-subtle);
      stroke-width: 6;
    }

    .progress-ring-fill {
      fill: none;
      stroke: var(--accent-green);
      stroke-width: 6;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s ease;
      filter: drop-shadow(0 0 6px var(--accent-green));
    }

    .progress-ring-value {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${monoFont};
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--accent-green);
    }

    .progress-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .sidebar-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .mini-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mini-stat:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-glow);
      transform: translateY(-1px);
    }

    .mini-stat-value {
      font-family: ${monoFont};
      font-size: 1rem;
      font-weight: 700;
    }

    .mini-stat-label {
      font-size: 0.6rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .mini-stat.passed .mini-stat-value { color: var(--accent-green); }
    .mini-stat.failed .mini-stat-value { color: var(--accent-red); }
    .mini-stat.flaky .mini-stat-value { color: var(--accent-yellow); }

    .sidebar-nav {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .sidebar-nav [role="tablist"] {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .clear-filters-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      opacity: 0.6;
      transition: all 0.2s;
    }

    .clear-filters-btn:hover {
      opacity: 1;
      background: var(--bg-card);
      color: var(--text-primary);
    }

    .nav-item {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.85rem;
      text-align: left;
    }

    .nav-item:hover {
      background: var(--bg-card);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--bg-card);
      color: var(--accent-green);
      border-left: 3px solid var(--accent-green);
      padding-left: calc(0.75rem - 3px);
    }

    .nav-icon { font-size: 1rem; flex-shrink: 0; }
    .nav-label { flex: 1; font-weight: 500; white-space: nowrap; }
    .nav-badge {
      font-family: ${monoFont};
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      background: var(--bg-secondary);
      border-radius: 10px;
      color: var(--text-muted);
    }

    .sidebar-filters {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .filter-group {
      margin-bottom: 0.75rem;
    }

    .filter-group:last-child { margin-bottom: 0; }

    .filter-group-title {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
      padding-left: 0.25rem;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .filter-chip {
      font-family: ${monoFont};
      font-size: 0.65rem;
      padding: 0.35rem 0.6rem;
      border-radius: 20px;
      border: 1px solid var(--border-subtle);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-chip:hover {
      background: var(--bg-card);
      color: var(--text-secondary);
      border-color: var(--border-glow);
    }

    .filter-chip.active {
      background: var(--bg-card);
      color: var(--accent-blue);
      border-color: var(--accent-blue);
    }

    .grade-chips .filter-chip {
      min-width: 28px;
      text-align: center;
    }

    .filter-chip.grade-a { border-color: var(--accent-green-dim); }
    .filter-chip.grade-a:hover, .filter-chip.grade-a.active { background: var(--accent-green); color: var(--bg-primary); border-color: var(--accent-green); }
    .filter-chip.grade-b { border-color: var(--accent-blue-dim); }
    .filter-chip.grade-b:hover, .filter-chip.grade-b.active { background: var(--accent-blue); color: var(--bg-primary); border-color: var(--accent-blue); }
    .filter-chip.grade-c { border-color: var(--accent-yellow-dim); }
    .filter-chip.grade-c:hover, .filter-chip.grade-c.active { background: var(--accent-yellow); color: var(--bg-primary); border-color: var(--accent-yellow); }
    .filter-chip.grade-d { border-color: var(--accent-orange); }
    .filter-chip.grade-d:hover, .filter-chip.grade-d.active { background: var(--accent-orange); color: var(--bg-primary); border-color: var(--accent-orange); }
    .filter-chip.grade-f { border-color: var(--accent-red-dim); }
    .filter-chip.grade-f:hover, .filter-chip.grade-f.active { background: var(--accent-red); color: var(--bg-primary); border-color: var(--accent-red); }

    /* Attention filter chips */
    .attention-chips .filter-chip {
      font-weight: 500;
    }
    .filter-chip.attention-new-failure { border-color: var(--accent-red-dim); }
    .filter-chip.attention-new-failure:hover:not(.active) { 
      background: rgba(255, 68, 102, 0.15); 
      color: var(--accent-red); 
      border-color: var(--accent-red); 
    }
    .filter-chip.attention-new-failure.active { 
      background: var(--accent-red); 
      color: var(--bg-primary); 
      border-color: var(--accent-red); 
    }
    .filter-chip.attention-regression { border-color: var(--accent-orange); }
    .filter-chip.attention-regression:hover:not(.active) { 
      background: rgba(255, 136, 68, 0.15); 
      color: var(--accent-orange); 
      border-color: var(--accent-orange); 
    }
    .filter-chip.attention-regression.active { 
      background: var(--accent-orange); 
      color: var(--bg-primary); 
      border-color: var(--accent-orange); 
    }
    .filter-chip.attention-fixed { border-color: var(--accent-green-dim); }
    .filter-chip.attention-fixed:hover:not(.active) { 
      background: rgba(0, 255, 136, 0.15); 
      color: var(--accent-green); 
      border-color: var(--accent-green); 
    }
    .filter-chip.attention-fixed.active { 
      background: var(--accent-green); 
      color: var(--bg-primary); 
      border-color: var(--accent-green); 
    }

    /* Collapsible filter groups */
    .filter-group-collapsible > .filter-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 0.2rem 0.25rem;
      border-radius: 4px;
      transition: background 0.15s;
      margin-bottom: 0.4rem;
      user-select: none;
    }
    .filter-group-collapsible > .filter-group-header:hover {
      background: var(--bg-card);
    }
    .filter-group-header-left {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .filter-group-chevron {
      font-size: 0.55rem;
      color: var(--text-muted);
      transition: transform 0.2s;
      line-height: 1;
    }
    .filter-group-collapsible.collapsed .filter-group-chevron {
      transform: rotate(-90deg);
    }
    .filter-group-badge {
      font-size: 0.55rem;
      font-family: ${monoFont};
      background: var(--accent-blue);
      color: var(--bg-primary);
      border-radius: 8px;
      padding: 0.05rem 0.35rem;
      display: none;
    }
    .filter-group-badge.visible { display: inline-block; }
    .filter-group-collapsible.collapsed .filter-group-body {
      display: none;
    }
    .filter-group-sub-title {
      font-size: 0.6rem;
      color: var(--text-muted);
      opacity: 0.7;
      margin-bottom: 0.3rem;
      padding-left: 0.25rem;
    }

    /* Filter separator */
    .filter-separator {
      height: 1px;
      background: var(--border-subtle);
      margin: 0.6rem 0;
      opacity: 0.5;
    }

    /* Metadata info rows inside filter groups */
    .filter-meta-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.25rem;
      font-size: 0.75rem;
    }
    .filter-meta-label {
      color: var(--text-muted);
      flex-shrink: 0;
      min-width: 54px;
      font-size: 0.72rem;
    }
    .filter-meta-value {
      color: var(--text-secondary);
      font-size: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .filter-meta-mono {
      font-family: ${monoFont};
      font-size: 0.58rem;
      color: var(--text-secondary);
    }

    /* Hint label next to filter group sub-title (e.g. "Branch  Trends view") */
    .filter-sub-hint {
      font-size: 0.55rem;
      color: var(--text-muted);
      opacity: 0.6;
      margin-left: 0.3rem;
      font-style: italic;
    }

    /* Branch / environment / browser / release filter chips */
    .filter-chip.branch-chip { border-color: #0ea5e9; }
    .filter-chip.branch-chip:hover, .filter-chip.branch-chip.active { background: #0ea5e9; color: var(--bg-primary); border-color: #0ea5e9; }
    .filter-chip.env-chip { border-color: #f59e0b; }
    .filter-chip.env-chip:hover, .filter-chip.env-chip.active { background: #f59e0b; color: var(--bg-primary); border-color: #f59e0b; }
    .filter-chip.browser-chip { border-color: #0d9488; }
    .filter-chip.browser-chip:hover, .filter-chip.browser-chip.active { background: #0d9488; color: #fff; border-color: #0d9488; }
    .filter-chip.release-chip { border-color: #16a34a; }
    .filter-chip.release-chip:hover, .filter-chip.release-chip.active { background: #16a34a; color: #fff; border-color: #16a34a; }

    /* Trend filter active-state banner */
    .trend-filter-banner {
      display: none;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: color-mix(in srgb, var(--accent-blue) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent-blue) 30%, transparent);
      border-radius: 6px;
      padding: 0.35rem 0.75rem;
      margin-bottom: 0.75rem;
    }

    /* Project context chips */
    .filter-chip.project-org { border-color: #6366f1; }
    .filter-chip.project-org:hover, .filter-chip.project-org.active { background: #6366f1; color: var(--bg-primary); border-color: #6366f1; }
    .filter-chip.project-team { border-color: #8b5cf6; }
    .filter-chip.project-team:hover, .filter-chip.project-team.active { background: #8b5cf6; color: var(--bg-primary); border-color: #8b5cf6; }
    .filter-chip.project-app { border-color: var(--accent-blue-dim); }
    .filter-chip.project-app:hover, .filter-chip.project-app.active { background: var(--accent-blue); color: var(--bg-primary); border-color: var(--accent-blue); }

    /* Build context chips */
    .filter-chip.build-env { border-color: var(--accent-green-dim); }
    .filter-chip.build-env:hover, .filter-chip.build-env.active { background: var(--accent-green); color: var(--bg-primary); border-color: var(--accent-green); }
    .filter-chip.build-branch { border-color: var(--accent-yellow-dim); }
    .filter-chip.build-branch:hover, .filter-chip.build-branch.active { background: var(--accent-yellow); color: var(--bg-primary); border-color: var(--accent-yellow); }
    .filter-chip.build-pr { border-color: var(--accent-orange); }
    .filter-chip.build-pr:hover, .filter-chip.build-pr.active { background: var(--accent-orange); color: var(--bg-primary); border-color: var(--accent-orange); }
    .filter-chip.build-release { border-color: #ec4899; }
    .filter-chip.build-release:hover, .filter-chip.build-release.active { background: #ec4899; color: var(--bg-primary); border-color: #ec4899; }
    .filter-chip.build-pwproject { border-color: var(--border-subtle); }
    .filter-chip.build-pwproject:hover, .filter-chip.build-pwproject.active { background: var(--bg-card); color: var(--text-primary); border-color: var(--text-muted); }

    /* Phase 3: Project breadcrumb in top bar */
    .project-breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.65rem;
      color: var(--text-muted);
      font-family: ${monoFont};
      overflow: hidden;
      white-space: nowrap;
    }
    .project-breadcrumb-item {
      color: var(--text-secondary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .project-breadcrumb-item.active {
      color: var(--accent-blue);
    }
    .project-breadcrumb-sep {
      color: var(--border-subtle);
      flex-shrink: 0;
    }
    .project-breadcrumb-env {
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      background: rgba(0,255,136,0.1);
      color: var(--accent-green);
      border: 1px solid var(--accent-green-dim);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .sidebar-files {
      padding: 0.75rem;
      flex-shrink: 0;
    }

    .file-tree {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .file-tree-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.8rem;
    }

    .file-tree-item:hover {
      background: var(--bg-card);
    }

    .file-tree-item.active {
      background: var(--bg-card);
      box-shadow: inset 2px 0 0 var(--accent-blue);
    }

    .file-tree-icon { font-size: 0.85rem; }
    .file-tree-name {
      flex: 1;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-tree-item.has-failures .file-tree-name { color: var(--accent-red); }
    .file-tree-item.all-passed .file-tree-name { color: var(--text-secondary); }

    .file-tree-stats {
      display: flex;
      gap: 0.25rem;
    }

    .file-stat {
      font-family: ${monoFont};
      font-size: 0.65rem;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .file-stat.passed { color: var(--accent-green); background: rgba(0, 255, 136, 0.1); }
    .file-stat.failed { color: var(--accent-red); background: rgba(255, 68, 102, 0.1); }

    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }

    .run-duration {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* ============================================
       MAIN CONTENT AREA
    ============================================ */
    .main-content {
      grid-area: main;
      overflow-y: auto;
      background: var(--bg-primary);
    }

    .view-panel {
      height: 100%;
      overflow-y: auto;
    }

    .view-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
    }

    .view-title {
      font-size: 1.25rem;
      font-weight: 600;
    }

    /* ============================================
       OVERVIEW VIEW
    ============================================ */
    .overview-content {
      padding: 1.5rem;
    }

    .overview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card.large {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      transition: all 0.2s;
    }

    .stat-card.large:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .stat-icon {
      font-size: 1.5rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: var(--bg-secondary);
    }

    .stat-card.large.passed { border-left: 3px solid var(--accent-green); }
    .stat-card.large.passed .stat-icon { background: rgba(0, 255, 136, 0.1); color: var(--accent-green); }
    .stat-card.large.failed { border-left: 3px solid var(--accent-red); }
    .stat-card.large.failed .stat-icon { background: rgba(255, 68, 102, 0.1); color: var(--accent-red); }
    .stat-card.large.skipped { border-left: 3px solid var(--text-muted); }
    .stat-card.large.skipped .stat-icon { background: rgba(90, 90, 112, 0.1); color: var(--text-muted); }
    .stat-card.large.flaky { border-left: 3px solid var(--accent-yellow); }
    .stat-card.large.flaky .stat-icon { background: rgba(255, 204, 0, 0.1); color: var(--accent-yellow); }
    .stat-card.large.slow { border-left: 3px solid var(--accent-orange); }
    .stat-card.large.slow .stat-icon { background: rgba(255, 136, 68, 0.1); color: var(--accent-orange); }
    .stat-card.large.duration { border-left: 3px solid var(--accent-blue); }
    .stat-card.large.duration .stat-icon { background: rgba(0, 170, 255, 0.1); color: var(--accent-blue); }

    .stat-content { flex: 1; }

    .stat-card.large .stat-value {
      font-family: ${monoFont};
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-card.large .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .overview-trends {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.5rem;
    }

    /* ============================================
       OVERVIEW - HERO STATS
    ============================================ */
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .hero-stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1.25rem;
      transition: all 0.2s;
    }

    .hero-stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }

    .hero-stat-card.health {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .health-gauge {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .health-ring {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .health-ring-bg {
      fill: none;
      stroke: var(--border-subtle);
      stroke-width: 8;
    }

    .health-ring-fill {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s ease;
    }

    .hero-stat-card.health.excellent .health-ring-fill { stroke: var(--accent-green); }
    .hero-stat-card.health.good .health-ring-fill { stroke: var(--accent-blue); }
    .hero-stat-card.health.fair .health-ring-fill { stroke: var(--accent-yellow); }
    .hero-stat-card.health.poor .health-ring-fill { stroke: var(--accent-red); }

    .health-score {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .health-grade {
      font-size: 1.5rem;
      font-weight: 800;
      display: block;
    }

    .hero-stat-card.health.excellent .health-grade { color: var(--accent-green); }
    .hero-stat-card.health.good .health-grade { color: var(--accent-blue); }
    .hero-stat-card.health.fair .health-grade { color: var(--accent-yellow); }
    .hero-stat-card.health.poor .health-grade { color: var(--accent-red); }

    .health-value {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .hero-stat-info {
      flex: 1;
    }

    .health-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    .hero-stat-main {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .hero-stat-value {
      font-family: ${monoFont};
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .hero-stat-delta {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }

    .hero-stat-delta.positive {
      color: var(--accent-green);
      background: rgba(0, 255, 136, 0.1);
    }

    .hero-stat-delta.negative {
      color: var(--accent-red);
      background: rgba(255, 68, 102, 0.1);
    }

    .hero-stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .hero-stat-detail {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* Mini Comparison Bars */
    .mini-comparison {
      padding: 1rem;
    }

    .mini-bars {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .mini-bar-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mini-bar-row.clickable {
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      margin: -0.35rem -0.5rem;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .mini-bar-row.clickable:hover {
      background: var(--bg-card-hover);
    }

    .mini-bar-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      width: 50px;
    }

    .mini-bar-track {
      flex: 1;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .mini-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .mini-bar.passed { background: var(--accent-green); }
    .mini-bar.failed { background: var(--accent-red); }
    .mini-bar.skipped { background: var(--text-muted); }

    .mini-bar-value {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-secondary);
      width: 30px;
      text-align: right;
    }

    /* ============================================
       OVERVIEW - ATTENTION SECTION
    ============================================ */
    .overview-section {
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .section-icon {
      font-size: 1.1rem;
    }

    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .attention-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .attention-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 4px solid transparent;
    }

    .attention-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .attention-card.critical {
      border-left-color: var(--accent-red);
      background: linear-gradient(135deg, rgba(255, 68, 102, 0.05) 0%, transparent 50%);
    }

    .attention-card.warning {
      border-left-color: var(--accent-yellow);
      background: linear-gradient(135deg, rgba(255, 204, 0, 0.05) 0%, transparent 50%);
    }

    .attention-card.success {
      border-left-color: var(--accent-green);
      background: linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, transparent 50%);
    }

    .attention-value {
      font-family: ${monoFont};
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .attention-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .attention-desc {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* ============================================
       OVERVIEW - FAILURE CLUSTERS
    ============================================ */
    .failure-clusters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .cluster-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--accent-red);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cluster-card:hover {
      background: var(--bg-card-hover);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .cluster-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cluster-icon {
      font-size: 1rem;
    }

    .cluster-type {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent-red);
      flex: 1;
    }

    .cluster-count {
      font-size: 0.7rem;
      color: var(--text-muted);
      background: var(--bg-secondary);
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
    }

    .cluster-error {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cluster-tests {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .cluster-test-name {
      font-size: 0.7rem;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .cluster-files {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.25rem;
    }

    .cluster-file {
      font-family: ${monoFont};
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    .cluster-more {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-style: italic;
    }

    /* ============================================
       OVERVIEW - QUICK INSIGHTS
    ============================================ */
    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .insight-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .insight-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .insight-icon {
      font-size: 1.5rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border-radius: 10px;
    }

    .insight-content {
      flex: 1;
      min-width: 0;
    }

    .insight-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }

    .insight-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .insight-value {
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .insight-mini-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .mini-stat {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot.passed { background: var(--accent-green); }
    .dot.failed { background: var(--accent-red); }
    .dot.skipped { background: var(--text-muted); }

    .mini-sparkline {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 30px;
      margin-top: 0.5rem;
    }

    .spark-col {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: flex-end;
    }

    .spark-bar {
      width: 100%;
      background: var(--accent-green);
      border-radius: 2px;
      min-height: 3px;
      transition: height 0.3s ease;
    }

    .mini-sparkline .no-data {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    /* ============================================
       TESTS VIEW - MASTER-DETAIL LAYOUT
    ============================================ */
    .master-detail-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      height: 100%;
    }

    .test-list-panel {
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .test-list-header {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-card);
    }

    .test-list-tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .tab-btn {
      font-size: 0.75rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      font-weight: 500;
    }

    .tab-btn:hover {
      background: var(--bg-card);
      color: var(--text-secondary);
    }

    .tab-btn.active {
      background: var(--bg-card);
      color: var(--accent-blue);
      border-color: var(--accent-blue);
    }

    .test-list-search {
      width: 100%;
    }

    .inline-search {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      color: var(--text-primary);
      font-family: ${monoFont};
      font-size: 0.8rem;
    }

    .inline-search:focus {
      outline: none;
      border-color: var(--accent-blue);
    }

    .inline-search::placeholder { color: var(--text-muted); }

    .test-list-content {
      flex: 1;
      overflow-y: auto;
    }

    .test-tab-content {
      display: none;
      padding: 0.5rem;
    }

    .test-tab-content.active { display: block; }

    /* Test List Items */
    .test-list-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      margin-bottom: 0.25rem;
      background: var(--bg-card);
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .test-list-item:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-subtle);
    }

    .test-list-item.selected {
      background: var(--bg-card-hover);
      border-color: var(--accent-blue);
      box-shadow: inset 3px 0 0 var(--accent-blue);
    }

    .test-item-status { flex-shrink: 0; }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .status-dot.passed { background: var(--accent-green); box-shadow: 0 0 8px var(--accent-green); }
    .status-dot.failed { background: var(--accent-red); box-shadow: 0 0 8px var(--accent-red); }
    .status-dot.skipped { background: var(--text-muted); }

    .test-item-info {
      flex: 1;
      min-width: 0;
    }

    .test-item-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .test-item-file {
      font-family: ${monoFont};
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .test-item-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .test-item-duration {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .test-item-badge {
      font-family: ${monoFont};
      font-size: 0.6rem;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .test-item-badge.flaky { background: rgba(255, 204, 0, 0.15); color: var(--accent-yellow); }
    .test-item-badge.slow { background: rgba(255, 136, 68, 0.15); color: var(--accent-orange); }
    .test-item-badge.new { background: rgba(0, 170, 255, 0.15); color: var(--accent-blue); }
    
    /* Attention badges - more prominent */
    .test-item-badge.new-failure { 
      background: rgba(255, 68, 102, 0.2); 
      color: var(--accent-red); 
      font-weight: 600;
      animation: pulse-badge 2s ease-in-out infinite;
    }
    .test-item-badge.regression { 
      background: rgba(255, 136, 68, 0.2); 
      color: var(--accent-orange);
      font-weight: 600;
    }
    .test-item-badge.fixed { 
      background: rgba(0, 255, 136, 0.2); 
      color: var(--accent-green);
      font-weight: 600;
    }

    @keyframes pulse-badge {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .stability-badge {
      font-family: ${monoFont};
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }

    .stability-badge.grade-a { background: rgba(0, 255, 136, 0.15); color: var(--accent-green); }
    .stability-badge.grade-b { background: rgba(0, 170, 255, 0.15); color: var(--accent-blue); }
    .stability-badge.grade-c { background: rgba(255, 204, 0, 0.15); color: var(--accent-yellow); }
    .stability-badge.grade-d { background: rgba(255, 136, 68, 0.15); color: var(--accent-orange); }
    .stability-badge.grade-f { background: rgba(255, 68, 102, 0.15); color: var(--accent-red); }

    /* Status/Stability Groups */
    .status-group, .stability-group {
      margin-bottom: 1rem;
    }

    .status-group-header, .stability-group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .status-group-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-group-dot.passed { background: var(--accent-green); }
    .status-group-dot.failed { background: var(--accent-red); }
    .status-group-dot.skipped { background: var(--text-muted); }

    /* Test Detail Panel */
    .test-detail-panel {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      background: var(--bg-primary);
    }

    .detail-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: var(--text-muted);
    }

    .placeholder-icon { font-size: 4rem; opacity: 0.3; }
    .placeholder-text { font-size: 1.1rem; }
    .placeholder-hint { font-size: 0.85rem; opacity: 0.6; }

    /* Detail View Content (when test is selected) */
    .detail-view-content {
      padding: 1.5rem;
    }

    .detail-view-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 1.5rem;
    }

    .detail-status-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .detail-status-indicator.passed { background: var(--accent-green); box-shadow: 0 0 12px var(--accent-green); }
    .detail-status-indicator.failed { background: var(--accent-red); box-shadow: 0 0 12px var(--accent-red); }
    .detail-status-indicator.skipped { background: var(--text-muted); }

    .detail-info { flex: 1; min-width: 0; }

    .detail-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
      word-break: break-word;
    }

    .detail-file {
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .detail-duration {
      font-family: ${monoFont};
      font-size: 1rem;
      color: var(--text-secondary);
      flex-shrink: 0;
    }

    /* Make test-card work inside detail panel */
    .test-detail-panel .test-card {
      background: transparent;
      border: none;
      border-radius: 0;
    }

    .test-detail-panel .test-card-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      cursor: default;
    }

    .test-detail-panel .test-details {
      display: block !important;
      padding: 1.5rem;
      background: transparent;
      border-top: none;
    }

    /* ============================================
       SEARCH MODAL
    ============================================ */
    .search-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
    }

    .search-modal.open { display: flex; }

    .search-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
    }

    .search-modal-content {
      position: relative;
      width: 100%;
      max-width: 600px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    .search-modal-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .search-modal-icon { font-size: 1.25rem; color: var(--text-muted); }

    .search-modal-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-size: 1rem;
      font-family: inherit;
    }

    .search-modal-input::placeholder { color: var(--text-muted); }

    .search-modal-esc {
      font-family: ${monoFont};
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-muted);
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }
    .search-modal-esc:hover {
      background: var(--border-subtle);
      color: var(--text-primary);
    }

    .search-modal-results {
      max-height: 400px;
      overflow-y: auto;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .search-result-item:hover {
      background: var(--bg-card-hover);
    }

    .search-result-item .status-dot { flex-shrink: 0; }

    .search-result-info { flex: 1; min-width: 0; }

    .search-result-title {
      font-size: 0.9rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-result-file {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* ============================================
       EXISTING STYLES (preserved from original)
    ============================================ */

    .progress-ring .value {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${monoFont};
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent-green);
    }

    /* Trend Chart - Pass Rate Over Time */
    .trend-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }

    .trend-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
      opacity: 0.8;
    }

    .trend-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      cursor: pointer;
      user-select: none;
    }

    .trend-header:hover .section-toggle {
      color: var(--text-primary);
    }

    .trend-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .trend-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: ${monoFont};
    }

    .section-toggle {
      color: var(--text-muted);
      font-size: 0.8rem;
      transition: transform 0.2s ease, color 0.2s ease;
      margin-left: 0.5rem;
    }

    .collapsible-section.collapsed .section-toggle {
      transform: rotate(-90deg);
    }

    .collapsible-section.collapsed .section-content {
      display: none;
    }

    .section-content {
      animation: slideDown 0.2s ease;
    }

    .trend-message {
      padding: 1.5rem;
      background: var(--bg-primary);
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      text-align: center;
      color: var(--text-secondary);
    }

    .trend-message p {
      margin: 0.5rem 0;
    }

    .trend-message code {
      background: var(--bg-secondary);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: ${monoFont};
      font-size: 0.85em;
    }

    .trend-chart {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 140px;
      padding: 20px 16px 12px;
      background: var(--bg-primary);
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      position: relative;
    }

    /* Grid lines */
    .trend-chart::before {
      content: '';
      position: absolute;
      left: 8px;
      right: 8px;
      top: 25%;
      border-top: 1px dashed var(--border-subtle);
    }

    .trend-chart::after {
      content: '';
      position: absolute;
      left: 8px;
      right: 8px;
      top: 50%;
      border-top: 1px dashed var(--border-subtle);
    }

    .trend-bar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 40px;
      max-width: 60px;
      z-index: 1;
    }

    .trend-bar {
      width: 100%;
      background: linear-gradient(180deg, var(--accent-green) 0%, var(--accent-green-dim) 100%);
      border-radius: 6px 6px 2px 2px;
      transition: all 0.3s ease;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 255, 136, 0.2);
    }

    .trend-bar:hover {
      transform: scaleY(1.02);
      box-shadow: 0 4px 16px rgba(0, 255, 136, 0.3);
    }

    .trend-bar.low {
      background: linear-gradient(180deg, var(--accent-red) 0%, var(--accent-red-dim) 100%);
      box-shadow: 0 2px 8px rgba(255, 68, 102, 0.2);
    }

    .trend-bar.low:hover {
      box-shadow: 0 4px 16px rgba(255, 68, 102, 0.3);
    }

    .trend-bar.medium {
      background: linear-gradient(180deg, var(--accent-yellow) 0%, var(--accent-yellow-dim) 100%);
      box-shadow: 0 2px 8px rgba(255, 204, 0, 0.2);
    }

    .trend-bar.medium:hover {
      box-shadow: 0 4px 16px rgba(255, 204, 0, 0.3);
    }

    .trend-bar.current {
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.4), 0 2px 8px rgba(0, 255, 136, 0.3);
      border: 2px solid var(--text-primary);
    }

    .trend-label {
      font-family: ${monoFont};
      font-size: 0.65rem;
      color: var(--text-muted);
      white-space: nowrap;
      margin-top: 4px;
    }


    /* Stacked Bar Styles */
    .trend-stacked-bar {
      width: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 6px 6px 2px 2px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .trend-segment {
      width: 100%;
      transition: all 0.2s ease;
      position: relative;
      cursor: pointer;
    }

    .trend-segment-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-family: ${monoFont};
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--bg-primary);
      background: rgba(0, 0, 0, 0.7);
      padding: 3px 6px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 10;
    }

    .trend-segment:hover .trend-segment-label {
      opacity: 1;
    }

    .trend-segment.passed {
      background: linear-gradient(180deg, var(--accent-green) 0%, var(--accent-green-dim) 100%);
    }

    .trend-segment.passed:hover {
      background: linear-gradient(180deg, #00ffaa 0%, var(--accent-green) 100%);
      box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.3), 0 0 12px rgba(0, 255, 136, 0.5);
      z-index: 2;
    }

    .trend-segment.passed .trend-segment-label {
      color: var(--accent-green);
    }

    .trend-segment.failed {
      background: linear-gradient(180deg, var(--accent-red) 0%, var(--accent-red-dim) 100%);
    }

    .trend-segment.failed:hover {
      background: linear-gradient(180deg, #ff6688 0%, var(--accent-red) 100%);
      box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 68, 102, 0.5);
      z-index: 2;
    }

    .trend-segment.failed .trend-segment-label {
      color: var(--accent-red);
    }

    .trend-segment.skipped {
      background: linear-gradient(180deg, var(--text-muted) 0%, #444455 100%);
    }

    .trend-segment.skipped:hover {
      background: linear-gradient(180deg, #8888bb 0%, var(--text-muted) 100%);
      box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.2), 0 0 12px rgba(136, 136, 187, 0.4);
      z-index: 2;
    }

    .trend-segment.skipped .trend-segment-label {
      color: #aaaacc;
    }

    .trend-bar-wrapper.current .trend-stacked-bar {
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.4), 0 2px 8px rgba(0, 255, 136, 0.3);
      border: 2px solid var(--text-primary);
    }

    /* Chart Bar Hover Effects */
    .chart-bar {
      cursor: default;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .chart-bar-clickable {
      cursor: pointer;
    }

    .chart-bar:hover {
      opacity: 1 !important;
      filter: brightness(1.1);
    }

    .bar-group {
      cursor: default;
    }

    .bar-group.clickable {
      cursor: pointer;
    }

    .bar-group.clickable:hover .chart-bar {
      transform: translateY(-2px);
      filter: brightness(1.2);
    }

    .bar-group:hover .chart-bar {
      transform: translateY(-2px);
    }

    /* History Banner */
    .history-banner {
      display: none;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin-top: 0.75rem;
      background: linear-gradient(135deg, rgba(0, 170, 255, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
      border: 1px solid var(--accent-blue-dim);
      border-radius: 8px;
    }

    .history-banner-icon {
      font-size: 1.25rem;
    }

    .history-banner-text {
      flex: 1;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .history-banner-text strong {
      color: var(--accent-blue);
    }

    .history-banner-close {
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--accent-blue);
      color: var(--bg-primary);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .history-banner-close:hover {
      filter: brightness(1.1);
    }

    /* Historical test item badge */
    .test-item-badge.historical {
      background: rgba(168, 85, 247, 0.15);
      color: #a855f7;
    }

    .test-list-item.historical-item {
      border-left: 3px solid #a855f7;
    }

    /* Chart Tooltip */
    .chart-tooltip {
      position: absolute;
      display: none;
      background: var(--bg-card);
      color: var(--text-primary);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      border: 1px solid var(--border-subtle);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: none;
      z-index: 10000;
      white-space: nowrap;
    }

    .line-chart-container {
      background: var(--bg-primary);
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .all-charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-top: 1rem;
    }

    @media (max-width: 1024px) {
      .all-charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .secondary-trends-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-top: 1rem;
    }

    @media (max-width: 1024px) {
      .secondary-trends-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Secondary Trend Sections (Duration, Flaky, Slow) - Aligned with main trends */
    .secondary-trends {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-top: 1.75rem;
      max-width: 100%;
    }

    .secondary-trend-section {
      background: var(--bg-primary);
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      padding: 1rem 0;
      width: 100%;
    }

    .secondary-trend-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.875rem;
      padding: 0 16px;
    }

    .secondary-trend-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .secondary-trend-chart {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 50px;
      padding: 8px 16px 12px;
      overflow-x: auto;
      flex-wrap: nowrap;
      scrollbar-width: auto;
      scrollbar-color: rgba(100, 100, 100, 0.6) rgba(0, 0, 0, 0.08);
    }

    .secondary-trend-chart::-webkit-scrollbar {
      height: 10px;
    }

    .secondary-trend-chart::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.08);
      border-radius: 4px;
    }

    .secondary-trend-chart::-webkit-scrollbar-thumb {
      background: rgba(100, 100, 100, 0.6);
      border-radius: 4px;
      min-width: 40px;
    }

    .secondary-trend-chart::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 100, 100, 0.9);
    }

    /* Force scrollbars to always be visible */
    .secondary-trend-chart::-webkit-scrollbar-button {
      display: none;
    }

    .secondary-bar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-width: 40px;
      max-width: 60px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .secondary-bar-wrapper:hover {
      transform: translateY(-2px);
    }

    .secondary-bar-wrapper:hover .secondary-value {
      color: var(--text-primary);
    }

    .secondary-bar {
      width: 100%;
      border-radius: 6px 6px 2px 2px;
      transition: all 0.2s ease;
    }

    .secondary-bar:hover {
      transform: scaleY(1.05);
    }

    .secondary-bar.current {
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.4), 0 2px 8px rgba(0, 255, 136, 0.3);
      border: 2px solid var(--text-primary);
    }

    /* Duration bars */
    .secondary-bar.duration {
      background: linear-gradient(180deg, var(--accent-purple) 0%, #7744cc 100%);
      box-shadow: 0 2px 8px rgba(170, 102, 255, 0.2);
    }

    .secondary-bar.duration:hover {
      box-shadow: 0 4px 16px rgba(170, 102, 255, 0.3);
      background: linear-gradient(180deg, #bb88ff 0%, var(--accent-purple) 100%);
    }

    /* Flaky bars */
    .secondary-bar.flaky {
      background: linear-gradient(180deg, var(--accent-yellow) 0%, var(--accent-yellow-dim) 100%);
      box-shadow: 0 2px 8px rgba(255, 204, 0, 0.2);
    }

    .secondary-bar.flaky:hover {
      box-shadow: 0 4px 16px rgba(255, 204, 0, 0.3);
      background: linear-gradient(180deg, #ffdd44 0%, var(--accent-yellow) 100%);
    }

    /* Slow bars */
    .secondary-bar.slow {
      background: linear-gradient(180deg, var(--accent-orange) 0%, #cc6633 100%);
      box-shadow: 0 2px 8px rgba(255, 136, 68, 0.2);
    }

    .secondary-bar.slow:hover {
      box-shadow: 0 4px 16px rgba(255, 136, 68, 0.3);
      background: linear-gradient(180deg, #ffaa66 0%, var(--accent-orange) 100%);
    }

    .secondary-value {
      font-family: ${monoFont};
      font-size: 0.6rem;
      color: var(--text-muted);
      margin-top: 4px;
      transition: color 0.2s ease;
    }

    /* Individual Test History Sparkline */
    .history-section {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: var(--bg-primary);
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
    }

    .history-column {
      flex: 1;
    }

	    .history-label {
	      font-size: 0.65rem;
	      text-transform: uppercase;
	      letter-spacing: 0.1em;
	      color: var(--text-muted);
	      margin-bottom: 0.5rem;
	    }

	    .sparkline-block {
	      display: inline-flex;
	      flex-direction: column;
	      align-items: flex-start;
	      width: fit-content;
	    }

	    .sparkline {
	      display: flex;
	      gap: 3px;
	      align-items: center;
	      height: 24px;
    }

    .spark-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: transform 0.2s ease;
      position: relative;
    }

    .spark-dot:hover {
      transform: scale(1.4);
    }

    .spark-dot[data-ts]:hover::after {
      content: attr(data-ts);
      position: absolute;
      bottom: 160%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 0.35rem 0.5rem;
      font-size: 0.75rem;
      font-family: ${monoFont};
      white-space: nowrap;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      pointer-events: none;
      z-index: 100000;
    }

    .spark-dot.pass {
      background: var(--accent-green);
      box-shadow: 0 0 6px var(--accent-green);
    }

    .spark-dot.fail {
      background: var(--accent-red);
      box-shadow: 0 0 6px var(--accent-red);
    }

    .spark-dot.skip {
      background: var(--text-muted);
    }

	    .spark-dot.current {
	      width: 10px;
	      height: 10px;
	      border: 2px solid var(--text-primary);
	    }

	    .history-dot {
	      cursor: pointer;
	    }

	    .history-dot.selected {
	      outline: 2px solid rgba(255, 255, 255, 0.85);
	      outline-offset: 2px;
	    }

	    .duration-bar.selected {
	      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.75);
	    }

	    .history-stats.passfail {
	      display: flex;
	      align-items: center;
	      justify-content: space-between;
	      gap: 0.75rem;
	      width: 100%;
	    }

	    .history-back-btn {
	      appearance: none;
	      border: 1px solid var(--border-subtle);
	      background: var(--bg-secondary);
	      color: var(--text-primary);
	      font-size: 0.75rem;
	      font-weight: 600;
	      padding: 0.25rem 0.5rem;
	      border-radius: 8px;
	      cursor: pointer;
	    }

	    .history-back-btn:hover {
	      border-color: var(--border-glow);
	      background: var(--bg-card-hover);
	    }

	    /* Duration Trend Mini Chart */
	    .duration-chart {
	      display: flex;
	      align-items: flex-end;
      gap: 2px;
      height: 32px;
      padding: 4px 0;
    }

    .duration-bar {
      width: 8px;
      min-height: 4px;
      background: var(--accent-blue);
      border-radius: 2px 2px 0 0;
      transition: all 0.2s ease;
    }

    .duration-bar:hover {
      filter: brightness(1.2);
    }

    .duration-bar.current {
      background: var(--accent-purple);
      box-shadow: 0 0 8px var(--accent-purple);
    }

    .duration-bar.slower {
      background: var(--accent-orange);
    }

    .duration-bar.faster {
      background: var(--accent-green);
    }

    .history-stats {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .history-stat {
      font-family: ${monoFont};
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .history-stat span {
      color: var(--text-secondary);
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
    }

    .filter-btn {
      font-family: ${monoFont};
      font-size: 0.8rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-card);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-glow);
      color: var(--text-primary);
    }

    .filter-btn.active {
      background: var(--text-primary);
      color: var(--bg-primary);
      border-color: var(--text-primary);
    }

    /* Stability Score Filters */
    .stability-filters {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: -0.5rem;
    }

    .filter-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-right: 0.5rem;
    }

    .filter-btn.stability-grade {
      min-width: 50px;
    }

    .filter-btn.stability-grade.active {
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
    }

    /* Search Container */
    .search-container {
      margin-bottom: 1rem;
    }

    .search-wrapper {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      padding-left: 2.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: ${monoFont};
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    /* Test Cards */
    .test-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .test-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Allow history tooltips to escape the card when expanded */
    .test-card.expanded {
      overflow: visible;
      position: relative;
      z-index: 1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .test-card:hover {
      border-color: var(--border-glow);
      background: var(--bg-card-hover);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .test-card.keyboard-focus {
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 2px rgba(0, 170, 255, 0.3);
      background: var(--bg-card-hover);
    }

    .test-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      cursor: pointer;
      gap: 1rem;
    }

    .test-card-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 0;
      flex: 1;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.passed {
      background: var(--accent-green);
      box-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
    }

    .status-indicator.failed {
      background: var(--accent-red);
      box-shadow: 0 0 8px rgba(255, 68, 102, 0.5);
    }

    .status-indicator.skipped {
      background: var(--text-muted);
      box-shadow: none;
    }

    .test-info { min-width: 0; flex: 1; }

    .test-title {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .test-file {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .test-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .test-meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .test-badges-row {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      flex-wrap: wrap;
      margin-top: 0.4rem;
      padding-top: 0.4rem;
      border-top: 1px dashed var(--border-color);
    }

    .badge-separator {
      width: 1px;
      height: 14px;
      background: var(--border-color);
      margin: 0 0.15rem;
      flex-shrink: 0;
    }

    .test-suite-badge {
      font-family: ${monoFont};
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
    }

    .test-tags {
      display: inline-flex;
      gap: 0.3rem;
      flex-wrap: wrap;
    }

    .test-tag {
      font-family: ${monoFont};
      font-size: 0.6rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: var(--accent-blue);
      color: white;
      font-weight: 500;
      white-space: nowrap;
    }

    .test-browser-badge {
      font-family: ${monoFont};
      font-size: 0.6rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: var(--accent-purple);
      color: white;
      font-weight: 500;
      white-space: nowrap;
    }

    .test-project-badge {
      font-family: ${monoFont};
      font-size: 0.6rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: var(--bg-hover);
      border: 1px solid var(--accent-purple);
      color: var(--accent-purple);
      font-weight: 500;
      white-space: nowrap;
    }

    .test-annotation-badge {
      font-family: ${monoFont};
      font-size: 0.6rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: var(--bg-hover);
      color: var(--text-secondary);
      font-weight: 500;
      white-space: nowrap;
    }

    .test-annotation-badge.annotation-slow {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }

    .test-annotation-badge.annotation-fixme,
    .test-annotation-badge.annotation-fix {
      background: #fce7f3;
      color: #9d174d;
      border: 1px solid #f9a8d4;
    }

    .test-annotation-badge.annotation-skip {
      background: #e0e7ff;
      color: #3730a3;
      border: 1px solid #a5b4fc;
    }

    .test-annotation-badge.annotation-issue,
    .test-annotation-badge.annotation-bug {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    .test-annotation-badge.annotation-critical {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #f87171;
    }

    .test-annotation-badge.annotation-experimental {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #6ee7b7;
    }

    .suite-chips .filter-chip,
    .tag-chips .filter-chip {
      background: var(--bg-card);
    }

    .suite-chips .filter-chip.active {
      background: var(--accent-purple);
      color: white;
      border-color: var(--accent-purple);
    }

    .tag-chips .filter-chip.active {
      background: var(--accent-blue);
      color: white;
      border-color: var(--accent-blue);
    }

    .test-card-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .test-duration {
      font-family: ${monoFont};
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .badge {
      font-family: ${monoFont};
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      border: 1px solid;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge.stable {
      color: var(--accent-green);
      border-color: var(--accent-green-dim);
      background: rgba(0, 255, 136, 0.1);
    }

    .badge.unstable {
      color: var(--accent-yellow);
      border-color: var(--accent-yellow-dim);
      background: rgba(255, 204, 0, 0.1);
    }

    .badge.flaky {
      color: var(--accent-red);
      border-color: var(--accent-red-dim);
      background: rgba(255, 68, 102, 0.1);
    }

    .badge.new {
      color: var(--text-muted);
      border-color: var(--border-subtle);
      background: rgba(90, 90, 112, 0.1);
    }

    .badge.skipped {
      color: var(--text-muted);
      border-color: var(--border-subtle);
      background: rgba(90, 90, 112, 0.1);
    }

    .badge.stability-high {
      color: var(--accent-green);
      border-color: var(--accent-green-dim);
      background: rgba(0, 255, 136, 0.1);
      font-weight: 600;
    }

    .badge.stability-medium {
      color: var(--accent-yellow);
      border-color: var(--accent-yellow-dim);
      background: rgba(255, 204, 0, 0.1);
      font-weight: 600;
    }

    .badge.stability-low {
      color: var(--accent-red);
      border-color: var(--accent-red-dim);
      background: rgba(255, 68, 102, 0.1);
      font-weight: 600;
    }

    .trend {
      font-family: ${monoFont};
      font-size: 0.75rem;
    }

    .trend.slower { color: var(--accent-orange); }
    .trend.faster { color: var(--accent-green); }
    .trend.stable { color: var(--text-muted); }

    .expand-icon {
      color: var(--text-muted);
      transition: transform 0.2s ease;
      font-size: 0.75rem;
    }

    .test-card.expanded .expand-icon {
      transform: rotate(90deg);
    }

    /* Test Details */
    .test-details {
      display: none;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
    }

    .test-card.expanded .test-details {
      display: block;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .detail-section {
      margin-bottom: 1rem;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .detail-label .icon {
      font-size: 1rem;
    }

    .error-box {
      font-family: ${monoFont};
      font-size: 0.8rem;
      background: rgba(255, 68, 102, 0.1);
      border: 1px solid var(--accent-red-dim);
      border-radius: 8px;
      padding: 1rem;
      color: var(--accent-red);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .stack-box {
      font-family: ${monoFont};
      font-size: 0.75rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 1rem;
      color: var(--text-secondary);
      overflow-x: auto;
      max-height: 200px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .ai-box {
      background: linear-gradient(135deg, rgba(0, 170, 255, 0.1) 0%, rgba(170, 102, 255, 0.1) 100%);
      border: 1px solid var(--accent-blue-dim);
      border-radius: 8px;
      padding: 1rem;
      color: var(--text-primary);
      font-size: 0.9rem;
      position: relative;
    }

    .ai-box::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 20px;
      right: 20px;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      border-radius: 2px;
    }

    /* AI Markdown Rendering */
    .ai-markdown p { margin: 0.5rem 0; }
    .ai-markdown p:first-child { margin-top: 0; }
    .ai-markdown p:last-child { margin-bottom: 0; }

    .ai-markdown .ai-heading {
      margin: 0.75rem 0 0.35rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .ai-markdown .ai-h1,
    .ai-markdown .ai-h2 { font-size: 1.05rem; }
    .ai-markdown .ai-h3 { font-size: 1rem; }
    .ai-markdown .ai-h4,
    .ai-markdown .ai-h5,
    .ai-markdown .ai-h6 { font-size: 0.95rem; }

    .ai-markdown .ai-list {
      margin: 0.5rem 0;
      padding-left: 1.25rem;
    }
    .ai-markdown .ai-list li { margin: 0.15rem 0; }

    .ai-markdown .ai-inline-code {
      font-family: ${monoFont};
      font-size: 0.85em;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 0.1rem 0.35rem;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .ai-markdown .ai-code-block {
      margin: 0.75rem 0;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      overflow: hidden;
      background: var(--bg-primary);
      position: relative;
    }

    .ai-markdown .ai-code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.45rem 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(0, 0, 0, 0.15);
    }

    .ai-markdown .ai-code-lang {
      font-family: ${monoFont};
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .ai-markdown .copy-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: ${monoFont};
    }

    .ai-markdown .copy-btn:hover {
      background: var(--border-subtle);
      color: var(--text-primary);
    }

    .ai-markdown .copy-btn.copied {
      background: var(--accent-green);
      border-color: var(--accent-green);
      color: var(--bg-primary);
    }

    .ai-markdown pre {
      margin: 0;
      padding: 0.85rem 0.95rem;
      overflow-x: auto;
    }

    .ai-markdown pre code {
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--text-secondary);
      white-space: pre;
      display: block;
    }

    /* Console Logs Panel */
    .collapsible-label {
      cursor: pointer;
      user-select: none;
    }
    .collapsible-label:hover {
      color: var(--text-primary);
    }
    .console-summary {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-left: 0.4rem;
    }
    .collapse-icon {
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-left: auto;
    }
    .console-log-panel {
      font-family: ${monoFont};
      font-size: 0.78rem;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      overflow: hidden;
      margin-top: 0.4rem;
    }
    .console-entry {
      display: grid;
      grid-template-columns: 52px 1fr auto;
      gap: 0.5rem;
      padding: 0.3rem 0.6rem;
      border-bottom: 1px solid var(--border-subtle);
      align-items: start;
    }
    .console-entry:last-child { border-bottom: none; }
    .console-entry.console-error { background: rgba(239,68,68,0.07); }
    .console-entry.console-warn  { background: rgba(245,158,11,0.07); }
    .console-level {
      font-weight: 600;
      font-size: 0.65rem;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      text-transform: uppercase;
      align-self: start;
      white-space: nowrap;
    }
    .console-error .console-level { background: rgba(239,68,68,0.2); color: #ef4444; }
    .console-warn  .console-level { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .console-log   .console-level,
    .console-info  .console-level,
    .console-debug .console-level { background: var(--bg-card); color: var(--text-muted); }
    .console-text {
      color: var(--text-secondary);
      word-break: break-word;
      white-space: pre-wrap;
    }
    .console-ts {
      font-size: 0.65rem;
      color: var(--text-muted);
      white-space: nowrap;
      align-self: start;
    }

    /* Network Logs Section */
    .network-logs-section {
      margin-top: 1rem;
    }

    .network-logs-section .detail-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .network-summary {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: normal;
      margin-left: 0.5rem;
    }

    .network-error-count {
      color: var(--accent-red);
      margin-left: 0.5rem;
    }

    .network-slowest {
      color: var(--accent-orange);
      margin-left: 0.5rem;
    }

    .network-status-summary {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .network-status-badge {
      font-family: ${monoFont};
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
    }

    .network-status-badge.success { border-color: var(--accent-green); color: var(--accent-green); }
    .network-status-badge.redirect { border-color: var(--accent-orange); color: var(--accent-orange); }
    .network-status-badge.error { border-color: var(--accent-red); color: var(--accent-red); }

    .network-entries {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 350px;
      overflow-y: auto;
      padding: 2px;
    }

    .network-entry {
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .network-entry.error {
      border-left: 3px solid var(--accent-red);
    }

    .network-entry-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.2s ease;
      min-height: 36px;
      box-sizing: border-box;
    }

    .network-entry-header:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .network-method {
      font-family: ${monoFont};
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      min-width: 45px;
      text-align: center;
      flex-shrink: 0;
    }

    .network-method.get { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .network-method.post { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .network-method.put { background: rgba(249, 115, 22, 0.2); color: #f97316; }
    .network-method.patch { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
    .network-method.delete { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    .network-url {
      flex: 1;
      min-width: 0;
      font-family: ${monoFont};
      font-size: 12px;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .network-status {
      font-family: ${monoFont};
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .network-status.success { color: var(--accent-green); }
    .network-status.redirect { color: var(--accent-orange); }
    .network-status.error { color: var(--accent-red); }

    .network-duration {
      font-family: ${monoFont};
      font-size: 11px;
      color: var(--text-muted);
      min-width: 50px;
      text-align: right;
      flex-shrink: 0;
    }

    .network-duration.slow {
      color: var(--accent-orange);
    }

    .network-size {
      font-family: ${monoFont};
      font-size: 10px;
      color: var(--text-muted);
      min-width: 50px;
      text-align: right;
      flex-shrink: 0;
    }

    .network-expand-icon {
      font-size: 10px;
      color: var(--text-muted);
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .network-entry.expanded .network-expand-icon {
      transform: rotate(90deg);
    }

    .network-entry-details {
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--border-subtle);
    }

    .network-timing-bar {
      display: flex;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      background: var(--border-subtle);
      margin-bottom: 12px;
    }

    .timing-segment {
      height: 100%;
      min-width: 2px;
    }

    .network-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }

    .network-meta-item {
      display: flex;
      gap: 6px;
      font-size: 12px;
    }

    .network-meta-item .meta-label {
      color: var(--text-muted);
    }

    .network-meta-item .meta-value {
      font-family: ${monoFont};
      color: var(--text-secondary);
    }

    .network-body {
      margin-top: 8px;
    }

    .network-body-label {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .network-body-content {
      font-family: ${monoFont};
      font-size: 11px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      padding: 8px;
      margin: 0;
      overflow-x: auto;
      max-height: 150px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .duration-compare {
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .duration-stats-row {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .p90-exceeded-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      background: rgba(245, 158, 11, 0.15);
      color: #d97706;
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 4px;
      margin-left: 4px;
      font-family: ${monoFont};
    }

    .budget-exceeded-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      background: rgba(239, 68, 68, 0.15);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 4px;
      margin-left: 4px;
      font-family: ${monoFont};
    }

    /* Step Timings */
    .steps-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .step-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-primary);
      border-radius: 6px;
      border: 1px solid var(--border-subtle);
    }

    .step-row.slowest {
      border-color: var(--accent-orange);
      background: rgba(255, 136, 68, 0.1);
    }

    .step-bar-container {
      flex: 1;
      height: 6px;
      background: var(--border-subtle);
      border-radius: 3px;
      overflow: hidden;
    }

    .step-bar {
      height: 100%;
      background: var(--accent-blue);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .step-row.slowest .step-bar {
      background: var(--accent-orange);
    }

    .step-title {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-secondary);
      min-width: 0;
      flex: 2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .step-row.slowest .step-title {
      color: var(--accent-orange);
    }

    .step-duration {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
      min-width: 60px;
      text-align: right;
    }

    .step-row.slowest .step-duration {
      color: var(--accent-orange);
      font-weight: 600;
    }

    .slowest-badge {
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      background: var(--accent-orange);
      color: var(--bg-primary);
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    /* File Groups */
    .file-group {
      margin-bottom: 1rem;
    }

    .file-group-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 0.5rem;
      transition: all 0.2s;
    }

    .file-group-header:hover {
      border-color: var(--border-glow);
    }

    .file-group-header .expand-icon {
      transition: transform 0.2s;
    }

    .file-group.collapsed .file-group-header .expand-icon {
      transform: rotate(-90deg);
    }

    .file-group-name {
      font-family: ${monoFont};
      font-size: 0.9rem;
      color: var(--text-primary);
      flex: 1;
    }

    .file-group-stats {
      display: flex;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .file-group-stat {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: ${monoFont};
    }

    .file-group-stat.passed { color: var(--accent-green); background: rgba(0, 255, 136, 0.1); }
    .file-group-stat.failed { color: var(--accent-red); background: rgba(255, 68, 102, 0.1); }

    .file-group-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-left: 1rem;
    }

    .file-group.collapsed .file-group-content {
      display: none;
    }

    /* Screenshot Display */
    .screenshot-box {
      margin-top: 0.5rem;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }

    .screenshot-box img {
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .screenshot-box img:hover {
      transform: scale(1.02);
    }

    /* Screenshot fallback for CSP-blocked images */
    .screenshot-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      background: var(--bg-secondary);
      border: 2px dashed var(--border-subtle);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--accent-blue);
      color: white;
      border: none;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .download-btn:hover {
      background: #0095e0;
    }

    /* Gallery fallback for CSP-blocked images */
    .gallery-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      height: 100%;
      min-height: 120px;
      background: var(--bg-secondary);
      border: 2px dashed var(--border-subtle);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.75rem;
    }

    .download-btn-small {
      padding: 0.3rem 0.6rem;
      background: var(--accent-blue);
      color: white;
      border: none;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.7rem;
      cursor: pointer;
    }

    .download-btn-small:hover {
      background: #0095e0;
    }

    .attachments {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .trace-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .trace-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      background: var(--bg-primary);
    }

    .trace-meta {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .trace-file {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .trace-file-name {
      font-weight: 600;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .trace-path {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .trace-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
      padding-top: 0.1rem;
    }

    .trace-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .trace-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      background: var(--bg-primary);
    }

    .trace-meta {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .trace-file {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .trace-file-name {
      font-weight: 600;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .trace-path {
      font-family: ${monoFont};
      font-size: 0.75rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .trace-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
      padding-top: 0.1rem;
    }

    .attachment-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      color: var(--accent-blue);
      text-decoration: none;
      font-family: ${monoFont};
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .attachment-link:hover {
      border-color: var(--accent-blue);
      background: rgba(0, 170, 255, 0.1);
    }

    button.attachment-link {
      cursor: pointer;
      color: var(--text-secondary);
      background: var(--bg-primary);
    }

    .download-zip-btn, .download-har-btn {
      margin-left: auto;
    }

    /* Issue badge — linked issue refs from type: 'issue' annotations (Phase 1) */
    .issue-badge {
      display: inline-block;
      font-size: 0.68rem;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(99, 102, 241, 0.12);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      cursor: pointer;
      text-decoration: none;
      font-family: ${monoFont};
      transition: background 0.15s;
    }
    .issue-badge:hover {
      background: rgba(99, 102, 241, 0.22);
    }

    /* Defect leakage row in the mini-comparison card (Phase 1) */
    .leakage-rate-row .mini-bar.defects {
      background: #f59e0b;
    }
    .leakage-rate-row .leakage-value {
      font-size: 0.68rem;
      white-space: nowrap;
      min-width: 0;
    }

    .export-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      color: var(--text-secondary);
      font-family: ${monoFont};
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .export-btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    /* Gallery Styles */
    .gallery-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
    }

    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .gallery-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .gallery-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .gallery-filter-btn {
      font-family: ${monoFont};
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .gallery-filter-btn:hover {
      border-color: var(--border-glow);
      color: var(--text-primary);
    }

    .gallery-filter-btn.active {
      background: var(--text-primary);
      color: var(--bg-primary);
      border-color: var(--text-primary);
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .gallery-item {
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .gallery-item:hover {
      border-color: var(--border-glow);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .gallery-item-preview {
      position: relative;
      width: 100%;
      height: 150px;
      overflow: hidden;
      background: var(--bg-primary);
    }

    .gallery-item-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gallery-item-preview.video-preview,
    .gallery-item-preview.trace-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
    }

    .gallery-item-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .gallery-item:hover .gallery-item-overlay {
      opacity: 1;
    }

    .gallery-item-icon {
      font-size: 2rem;
    }

    .gallery-item-info {
      padding: 0.75rem;
    }

    .gallery-item-title {
      font-size: 0.75rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }

    .gallery-item-status {
      font-family: ${monoFont};
      font-size: 0.65rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      display: inline-block;
    }

    .gallery-item-status.passed {
      color: var(--accent-green);
      background: rgba(0, 255, 136, 0.1);
    }

    .gallery-item-status.failed {
      color: var(--accent-red);
      background: rgba(255, 68, 102, 0.1);
    }

    .gallery-item-status.skipped {
      color: var(--text-muted);
      background: rgba(90, 90, 112, 0.1);
    }

    .gallery-item-link {
      display: inline-block;
      margin-top: 0.5rem;
      font-size: 0.7rem;
      color: var(--accent-blue);
      text-decoration: none;
    }

    .gallery-item-link:hover {
      text-decoration: underline;
    }

    /* Trace-specific styling */
    .trace-item .gallery-item-preview {
      background: linear-gradient(135deg, #1e3a5f, #0f1922);
    }

    .trace-icon-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .trace-file-icon {
      font-size: 2.5rem;
      filter: grayscale(0.3);
    }

    .trace-file-type {
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--accent-blue);
      background: rgba(59, 130, 246, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .gallery-trace-download {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      color: var(--text-primary);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .gallery-trace-download:hover {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15));
      border-color: rgba(59, 130, 246, 0.5);
      transform: translateY(-1px);
    }

    .download-icon {
      font-size: 1rem;
      display: flex;
      align-items: center;
    }

    /* Lightbox */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }

    .lightbox-close {
      position: absolute;
      top: 2rem;
      right: 2rem;
      font-size: 3rem;
      color: var(--text-primary);
      cursor: pointer;
      line-height: 1;
    }

    .lightbox-content {
      max-width: 90%;
      max-height: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .lightbox-img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 8px;
    }

    .lightbox-info {
      text-align: center;
    }

    .lightbox-test-title {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .lightbox-status {
      font-family: ${monoFont};
      font-size: 0.875rem;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      display: inline-block;
    }

    .lightbox-nav {
      display: flex;
      gap: 1rem;
    }

    .lightbox-prev,
    .lightbox-next {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: 1.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .lightbox-prev:hover,
    .lightbox-next:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-glow);
    }

    /* Comparison Styles */
    .comparison-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
    }

    .comparison-header {
      margin-bottom: 1.5rem;
    }

    .comparison-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .comparison-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: ${monoFont};
    }

    .comparison-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .comparison-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }

    .comparison-card-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .comparison-card-value {
      font-family: ${monoFont};
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .comparison-card-value.positive {
      color: var(--accent-green);
    }

    .comparison-card-value.negative {
      color: var(--accent-red);
    }

    .comparison-delta {
      display: block;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 400;
    }

    .comparison-delta.neutral {
      color: var(--text-muted);
    }

    .comparison-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .comparison-section-wrapper {
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      overflow: hidden;
    }

    .comparison-section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .comparison-section-header:hover {
      background: var(--bg-card-hover);
    }

    .comparison-section-header.failure-section {
      border-left: 3px solid var(--accent-red);
    }

    .comparison-section-header.fixed-section {
      border-left: 3px solid var(--accent-green);
    }

    .comparison-section-header.regression-section {
      border-left: 3px solid var(--accent-orange);
    }

    .comparison-section-header.improvement-section {
      border-left: 3px solid var(--accent-blue);
    }

    .comparison-section-header.new-section {
      border-left: 3px solid var(--accent-purple);
    }

    .comparison-section-title {
      flex: 1;
      font-weight: 600;
      color: var(--text-primary);
    }

    .comparison-section-count {
      font-family: ${monoFont};
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      background: var(--bg-primary);
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .comparison-section-content {
      padding: 0.5rem;
      border-top: 1px solid var(--border-subtle);
    }

    .comparison-item {
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .comparison-item:last-child {
      margin-bottom: 0;
    }

    .comparison-item-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .comparison-item-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .comparison-item-status.passed {
      background: var(--accent-green);
    }

    .comparison-item-status.failed {
      background: var(--accent-red);
    }

    .comparison-item-status.skipped {
      background: var(--text-muted);
    }

    .comparison-item-info {
      flex: 1;
      min-width: 0;
    }

    .comparison-item-title {
      font-size: 0.875rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .comparison-item-file {
      font-family: ${monoFont};
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .comparison-item-duration-badge {
      font-family: ${monoFont};
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      background: var(--bg-secondary);
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .comparison-item-details {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: ${monoFont};
      font-size: 0.75rem;
    }

    .comparison-item-duration {
      color: var(--text-muted);
    }

    .comparison-item-change {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .comparison-item-change.positive {
      color: var(--accent-green);
      background: rgba(0, 255, 136, 0.1);
    }

    .comparison-item-change.negative {
      color: var(--accent-orange);
      background: rgba(255, 136, 68, 0.1);
    }

    .comparison-item-error {
      margin-top: 0.5rem;
      font-family: ${monoFont};
      font-size: 0.7rem;
      color: var(--accent-red);
      background: rgba(255, 68, 102, 0.1);
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid var(--accent-red-dim);
    }

    /* ============================================
       TOAST NOTIFICATIONS
    ============================================ */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .toast {
      background: var(--bg-card);
      border: 1px solid var(--border-glow);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
      pointer-events: auto;
      max-width: 320px;
    }

    .toast.show {
      transform: translateX(0);
      opacity: 1;
    }

    .toast-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .toast-message {
      font-size: 0.85rem;
      color: var(--text-primary);
    }

    .toast.success { border-color: var(--accent-green); }
    .toast.success .toast-icon { color: var(--accent-green); }
    .toast.error { border-color: var(--accent-red); }
    .toast.error .toast-icon { color: var(--accent-red); }
    .toast.info { border-color: var(--accent-blue); }
    .toast.info .toast-icon { color: var(--accent-blue); }

    /* ============================================
       THEME DROPDOWN
    ============================================ */
    .theme-dropdown {
      position: relative;
      display: inline-block;
    }

    .theme-toggle {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.85rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .theme-toggle:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-glow);
      color: var(--text-primary);
    }

    .theme-toggle-icon { font-size: 1rem; }
    .theme-label { font-size: 0.8rem; }

    .theme-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--bg-card);
      border: 1px solid var(--border-glow);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 120px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
    }

    .theme-dropdown.open .theme-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .theme-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 0.85rem;
    }

    .theme-menu-item:first-child { border-radius: 8px 8px 0 0; }
    .theme-menu-item:last-child { border-radius: 0 0 8px 8px; }

    .theme-menu-item:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
    }

    .theme-menu-item.active {
      background: var(--bg-card-hover);
      color: var(--accent-blue);
    }

    .theme-menu-item.active::after {
      content: '✓';
      margin-left: auto;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .theme-label { display: none; }
    }

    /* ============================================
       ACCESSIBILITY - FOCUS INDICATORS
    ============================================ */
    *:focus-visible {
      outline: 2px solid var(--accent-blue);
      outline-offset: 2px;
    }

    button:focus-visible,
    .filter-chip:focus-visible,
    .nav-item:focus-visible,
    .test-card:focus-visible,
    .gallery-item:focus-visible {
      outline: 2px solid var(--accent-blue);
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(0, 170, 255, 0.2);
    }

    /* Skip to main content link for screen readers */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--accent-blue);
      color: white;
      padding: 8px 16px;
      z-index: 10001;
      text-decoration: none;
      font-weight: 600;
      border-radius: 0 0 8px 0;
      transition: top 0.3s ease;
    }

    .skip-link:focus {
      top: 0;
    }

    /* Visually hidden but accessible to screen readers */
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* ============================================
       EMPTY STATE UI
    ============================================ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      color: var(--text-muted);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .empty-state-message {
      font-size: 0.9rem;
      max-width: 300px;
      line-height: 1.5;
    }

    .empty-state-action {
      margin-top: 1rem;
      padding: 8px 16px;
      background: var(--accent-blue);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: background 0.2s ease;
    }

    .empty-state-action:hover {
      background: var(--accent-blue-dim);
    }

    /* ============================================
       MOBILE RESPONSIVE - PERSISTENT SIDEBAR
    ============================================ */
    @media (max-width: 768px) {
      :root {
        --sidebar-width: 200px;
      }

      .app-shell {
        grid-template-columns: var(--sidebar-width) 1fr;
      }

      .app-shell.sidebar-collapsed {
        grid-template-columns: 0 1fr;
      }

      .app-shell.sidebar-collapsed .sidebar {
        transform: translateX(-100%);
      }

      .sidebar {
        width: var(--sidebar-width);
      }

      /* Hide overlay on mobile - sidebar is persistent */
      .sidebar-overlay {
        display: none;
      }

      .top-bar-left .breadcrumbs {
        display: none;
      }

      .search-label, .btn-label, .search-kbd {
        display: none;
      }

      .filter-chips {
        flex-wrap: wrap;
      }

      /* Compact sidebar elements */
      .sidebar-progress {
        padding: 0.75rem;
      }

      .progress-ring-container {
        width: 60px;
        height: 60px;
      }

      .progress-ring {
        width: 60px;
        height: 60px;
      }

      .progress-ring circle {
        cx: 30;
        cy: 30;
        r: 25;
      }

      .progress-ring-value {
        font-size: 0.9rem;
      }

      .nav-item {
        padding: 0.5rem 0.6rem;
        font-size: 0.8rem;
      }

      .nav-icon {
        font-size: 0.9rem;
      }

      .mini-stat {
        padding: 0.4rem;
      }

      .mini-stat-value {
        font-size: 0.85rem;
      }

      .mini-stat-label {
        font-size: 0.55rem;
      }
    }

    /* ============================================
       SMOOTH TRANSITIONS
    ============================================ */
    .test-card,
    .gallery-item,
    .nav-item,
    .filter-chip,
    .sidebar,
    .main-panel {
      transition: all 0.2s ease;
    }

    .view-panel {
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .test-card-details {
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 2000px; }
    }

    /* ============================================
       PRINT STYLESHEET
    ============================================ */
    @media print {
      body {
        background: white;
        color: black;
        overflow: visible;
        height: auto;
      }

      .app-shell {
        display: block;
      }

      .sidebar,
      .top-bar,
      .filter-chips,
      .search-trigger,
      .theme-toggle,
      .toast-container,
      .lightbox {
        display: none !important;
      }

      .main-panel {
        padding: 0;
        overflow: visible;
        height: auto;
      }

      .test-card {
        break-inside: avoid;
        page-break-inside: avoid;
        border: 1px solid #ccc;
        margin-bottom: 1rem;
      }

      .test-card-details {
        display: block !important;
        max-height: none !important;
      }

      .view-panel {
        display: block !important;
      }

      a {
        text-decoration: underline;
      }

      .progress-ring,
      .trend-section,
      .gallery-section {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }

    /* ============================================
       CSV EXPORT BUTTON
    ============================================ */
    .export-dropdown {
      position: relative;
      display: inline-block;
    }

    .export-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--bg-card);
      border: 1px solid var(--border-glow);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 140px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
    }

    .export-dropdown.open .export-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .export-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 0.85rem;
    }

    .export-menu-item:first-child {
      border-radius: 8px 8px 0 0;
    }

    .export-menu-item:last-child {
      border-radius: 0 0 8px 8px;
    }

    .export-menu-item:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
    }

    /* ============================================
       SETTINGS DROPDOWN
    ============================================ */
    .top-bar-icon-btn {
      background: none;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      transition: all 0.15s ease;
    }
    .top-bar-icon-btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-glow);
      color: var(--text-primary);
    }
    .settings-dropdown {
      position: relative;
      display: inline-block;
    }
    .settings-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--bg-card);
      border: 1px solid var(--border-glow);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 160px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
    }
    .settings-dropdown.open .settings-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .settings-menu-section {
      padding: 6px 14px 4px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .settings-menu-divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 4px 0;
    }
    .settings-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-size: 0.85rem;
    }
    .settings-menu-item:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
    }
    .settings-menu-item.active {
      color: var(--accent-blue);
    }
    .settings-menu-item.active::after {
      content: '✓';
      margin-left: auto;
      font-size: 0.75rem;
    }

    /* ============================================
       CI INFO BAR
    ============================================ */
    .ci-info-bar {
      grid-area: footer;
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 16px;
      padding: 6px 20px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-family: ${monoFont};
      overflow: hidden;
    }
    /* Light mode: give footer a subtle gray so items don't blend into white page */
    @media (prefers-color-scheme: light) {
      :root:not([data-theme="dark"]) .ci-info-bar {
        background: #e8e8ec;
        border-top-color: #c8c8d0;
      }
      :root:not([data-theme="dark"]) .ci-info-bar code {
        background: #d0d0d8;
        border: 1px solid #b8b8c4;
        color: #333;
      }
      :root:not([data-theme="dark"]) .ci-provider {
        background: var(--accent-blue);
        color: #fff;
      }
    }
    [data-theme="light"] .ci-info-bar {
      background: #e8e8ec;
      border-top-color: #c8c8d0;
    }
    [data-theme="light"] .ci-info-bar code {
      background: #d0d0d8;
      border: 1px solid #b8b8c4;
      color: #333;
    }
    [data-theme="light"] .ci-provider {
      background: var(--accent-blue);
      color: #fff;
    }
    .ci-provider {
      background: var(--accent-blue);
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.65rem;
      letter-spacing: 0.5px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .ci-item { display: flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0; }
    .ci-label { color: var(--text-muted); }
    .ci-info-bar code {
      background: var(--bg-card);
      padding: 1px 6px;
      border-radius: 3px;
      font-family: ${monoFont};
    }

    /* ============================================
       STEP TIMELINE / FLAMECHART
    ============================================ */
    .step-timeline {
      position: relative;
      width: 100%;
      height: 40px;
      background: var(--bg-secondary);
      border-radius: 6px;
      overflow: hidden;
      margin: 8px 0;
      cursor: default;
    }
    .step-timeline-bar {
      position: absolute;
      top: 0;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      color: var(--text-primary);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      padding: 0 4px;
      transition: opacity 0.15s;
      cursor: pointer;
      border-right: 1px solid var(--bg-primary);
    }
    .step-timeline-bar:hover {
      opacity: 0.85;
      z-index: 1;
      outline: 2px solid var(--text-primary);
    }
    .step-timeline-bar.cat-navigation { background: #3b82f6; }
    .step-timeline-bar.cat-assertion { background: #22c55e; }
    .step-timeline-bar.cat-action { background: #a855f7; }
    .step-timeline-bar.cat-api { background: #f59e0b; }
    .step-timeline-bar.cat-wait { background: #6b7280; }
    .step-timeline-bar.cat-other { background: #64748b; }
    .step-timeline-legend {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      font-size: 0.65rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }
    .step-timeline-legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .step-timeline-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }

    /* ============================================
       ENHANCED TREND CHARTS
    ============================================ */
    .trend-moving-avg {
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .chart-anomaly-marker {
      stroke: var(--accent-red);
      stroke-width: 2;
      fill: none;
    }
    .chart-bar-anomaly {
      stroke: var(--accent-red) !important;
      stroke-width: 2 !important;
      stroke-dasharray: 4 2;
    }
    .trend-avg-label {
      font-size: 9px;
      fill: var(--accent-yellow);
      font-style: italic;
    }

    /* ============================================
       FAILURE DIFF VIEW
    ============================================ */
    .diff-container {
      background: var(--bg-secondary);
      border-radius: 8px;
      overflow: hidden;
      margin: 8px 0;
      font-family: ${monoFont};
      font-size: 0.75rem;
      border: 1px solid var(--border-subtle);
    }
    .diff-header {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .diff-line {
      padding: 2px 12px;
      font-family: ${monoFont};
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .diff-line.diff-expected {
      background: rgba(255, 68, 102, 0.1);
      color: var(--accent-red);
    }
    .diff-line.diff-expected::before {
      content: "- ";
      opacity: 0.5;
    }
    .diff-line.diff-actual {
      background: rgba(0, 255, 136, 0.1);
      color: var(--accent-green);
    }
    .diff-line.diff-actual::before {
      content: "+ ";
      opacity: 0.5;
    }
    .diff-line.diff-same {
      color: var(--text-muted);
    }
    .diff-line.diff-same::before {
      content: "  ";
      opacity: 0.5;
    }

    /* ============================================
       KEYBOARD SHORTCUTS
    ============================================ */
    .keyboard-hints {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 0.75rem;
      color: var(--text-secondary);
      z-index: 1000;
      display: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 320px;
    }
    .keyboard-hints.visible { display: block; }
    .keyboard-hints h4 {
      margin: 0 0 8px;
      color: var(--text-primary);
      font-size: 0.8rem;
    }
    .keyboard-hint-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }
    .keyboard-hint-row kbd {
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      padding: 1px 6px;
      border-radius: 4px;
      font-family: ${monoFont};
      font-size: 0.7rem;
      min-width: 24px;
      text-align: center;
    }

    /* ============================================
       VIRTUAL SCROLLING
    ============================================ */
    .virtual-scroll-container {
      height: calc(100vh - 200px);
      overflow-y: auto;
      position: relative;
    }
    .virtual-scroll-spacer {
      width: 100%;
    }
    .virtual-scroll-viewport {
      position: absolute;
      width: 100%;
    }
    .test-list-item-count {
      padding: 8px 16px;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
    }

    /* ============================================
       EXPORTABLE SUMMARY CARD
    ============================================ */
    .summary-export-modal {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .summary-export-modal.visible { display: flex; }
    .summary-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 16px 64px rgba(0,0,0,0.4);
    }
    .summary-card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    .summary-card-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .summary-card-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .summary-stat {
      text-align: center;
    }
    .summary-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      font-family: ${monoFont};
    }
    .summary-stat-value.passed { color: var(--accent-green); }
    .summary-stat-value.failed { color: var(--accent-red); }
    .summary-stat-value.rate { color: var(--accent-blue); }
    .summary-stat-label {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-card-bar {
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .summary-card-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .summary-card-footer {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-top: 16px;
    }
    .summary-card-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-secondary);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 0.8rem;
      font-family: ${primaryFont};
    }
    .summary-card-btn:hover { background: var(--bg-card-hover); }
    .summary-card-btn.primary {
      background: var(--accent-blue);
      color: #fff;
      border-color: var(--accent-blue);
    }

    /* ── Settings View ── */
    .settings-container {
      max-width: 860px;
      margin: 0;
      padding: 1.5rem 2rem;
    }

    .settings-header {
      margin-bottom: 1rem;
    }

    .settings-tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--border-subtle);
      margin-bottom: 1.5rem;
    }

    .settings-tab {
      padding: 0.6rem 1.2rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: ${monoFont};
      font-size: 0.85rem;
      transition: color 0.2s, border-color 0.2s;
    }

    .settings-tab:hover {
      color: var(--text-primary);
    }

    .settings-tab.active {
      color: var(--accent-blue);
      border-bottom-color: var(--accent-blue);
      font-weight: 600;
    }

    .settings-tab-panel {
      display: none;
    }

    .settings-tab-panel.active {
      display: block;
    }

    .setting-group {
      margin-bottom: 1.25rem;
    }

    .setting-label {
      display: block;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .setting-description {
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
      line-height: 1.4;
    }

    .setting-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      color: var(--text-primary);
      font-family: ${monoFont};
      font-size: 0.85rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .setting-input:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    .setting-select-wrapper {
      position: relative;
    }

    .setting-select {
      appearance: none;
      -webkit-appearance: none;
      padding-right: 2rem;
      cursor: pointer;
    }

    .setting-select-wrapper::after {
      content: '\\25BE';
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .setting-model-count {
      color: var(--accent-green, #22c55e);
      font-weight: 500;
    }

    .setting-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      inset: 0;
      background: var(--border-subtle);
      border-radius: 24px;
      cursor: pointer;
      transition: background 0.25s;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.25s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: var(--accent-blue);
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(20px);
    }

    .settings-callout {
      background: rgba(234, 179, 8, 0.08);
      border: 1px solid rgba(234, 179, 8, 0.3);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin-top: 1rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .settings-callout code {
      background: var(--bg-main);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-size: 0.78rem;
    }

    .settings-download-btn {
      display: inline-block;
      margin-top: 0.6rem;
      padding: 0.4rem 1rem;
      background: var(--accent-blue);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: ${monoFont};
      font-size: 0.8rem;
      transition: opacity 0.2s;
    }

    .settings-download-btn:hover {
      opacity: 0.85;
    }

    .settings-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }

    .settings-reset-btn {
      padding: 0.4rem 1rem;
      background: none;
      border: 1px solid var(--accent-red);
      border-radius: 6px;
      color: var(--accent-red);
      cursor: pointer;
      font-family: ${monoFont};
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .settings-reset-btn:hover {
      background: var(--accent-red);
      color: #fff;
    }

    /* ============================================
       CONFIRM MODAL
    ============================================ */
    .confirm-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2000;
      align-items: center;
      justify-content: center;
    }
    .confirm-modal.open {
      display: flex;
    }
    .confirm-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
    }
    .confirm-modal-content {
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--border-glow);
      border-radius: 12px;
      padding: 2rem;
      max-width: 360px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .confirm-modal-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }
    .confirm-modal-title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .confirm-modal-body {
      margin: 0 0 1.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .confirm-modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    .confirm-modal-btn {
      padding: 0.45rem 1.25rem;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      font-family: ${monoFont};
      transition: all 0.15s;
    }
    .confirm-modal-cancel {
      background: none;
      border: 1px solid var(--border-glow);
      color: var(--text-secondary);
    }
    .confirm-modal-cancel:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
    }
    .confirm-modal-ok {
      background: var(--accent-red);
      border: 1px solid var(--accent-red);
      color: #fff;
    }
    .confirm-modal-ok:hover {
      background: var(--accent-red-dim);
      border-color: var(--accent-red-dim);
    }

    /* Issue #13: Inline Trace Viewer Styles */
    ${generateTraceViewerStyles(monoFont)}

    /* ── Phase 4: Saved Views ─────────────────────────────────── */
    .sidebar-saved-views {
      padding: 0.5rem 0.75rem 0.75rem;
      border-top: 1px solid var(--border-subtle);
    }

    .saved-views-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .saved-views-title {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .saved-views-header-actions {
      display: flex;
      gap: 0.25rem;
    }

    .sv-icon-btn {
      background: none;
      border: none;
      padding: 0.2rem 0.3rem;
      border-radius: 4px;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.8rem;
      line-height: 1;
      transition: background 0.15s, color 0.15s;
    }

    .sv-icon-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
    }

    .saved-views-list {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      margin-bottom: 0.5rem;
    }

    .sv-empty {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-align: center;
      padding: 0.5rem 0;
    }

    .sv-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: 5px;
      padding: 0.2rem 0.35rem;
      transition: background 0.15s;
    }

    .sv-item:hover {
      background: var(--bg-card-hover);
    }

    .sv-item.sv-item-active {
      background: color-mix(in srgb, var(--accent-blue) 12%, transparent);
    }

    .sv-apply-btn {
      flex: 1;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      font-family: ${primaryFont};
      font-size: 0.78rem;
      color: var(--text-primary);
      padding: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.15s;
    }

    .sv-apply-btn:hover {
      color: var(--accent-blue);
    }

    .sv-item-active .sv-apply-btn {
      color: var(--accent-blue);
      font-weight: 600;
    }

    .sv-delete-btn {
      background: none;
      border: none;
      padding: 0.15rem 0.25rem;
      border-radius: 3px;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 0.7rem;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.15s, color 0.15s;
    }

    .sv-item:hover .sv-delete-btn {
      opacity: 1;
    }

    .sv-delete-btn:hover {
      color: var(--accent-red);
    }

    .save-view-area {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .sv-save-btn {
      background: none;
      border: 1px dashed var(--border-subtle);
      border-radius: 5px;
      padding: 0.3rem 0.5rem;
      width: 100%;
      cursor: pointer;
      font-family: ${primaryFont};
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-align: left;
      transition: border-color 0.15s, color 0.15s;
    }

    .sv-save-btn:hover {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    .sv-save-form {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .sv-name-input {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      padding: 0.3rem 0.5rem;
      font-family: ${primaryFont};
      font-size: 0.78rem;
      color: var(--text-primary);
      width: 100%;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
    }

    .sv-name-input:focus {
      border-color: var(--accent-blue);
    }

    .sv-save-form-actions {
      display: flex;
      gap: 0.35rem;
    }

    .sv-btn {
      flex: 1;
      padding: 0.3rem 0.5rem;
      border-radius: 5px;
      border: 1px solid var(--border-subtle);
      background: none;
      cursor: pointer;
      font-family: ${primaryFont};
      font-size: 0.75rem;
      color: var(--text-secondary);
      transition: all 0.15s;
    }

    .sv-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
    }

    .sv-btn-primary {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    .sv-btn-primary:hover {
      background: var(--accent-blue);
      color: #fff;
    }

    /* ── Phase 5: Comparison Quick-Selectors ─────────────────── */
    .comparison-qs-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 1rem;
    }

    .comparison-qs-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .comparison-qs-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-right: 0.25rem;
    }

    .comparison-qs-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 0.3rem 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .comparison-qs-name {
      font-size: 0.78rem;
      font-family: ${monoFont};
      color: var(--text-primary);
    }

    .comparison-qs-meta {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    /* ── Phase 6: Extended Search Result Groups ───────────────── */
    .search-result-group-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 0.6rem 1rem 0.25rem;
    }

    .search-result-error {
      font-size: 0.72rem;
      color: var(--accent-red);
      font-family: ${monoFont};
      margin-top: 0.15rem;
      opacity: 0.85;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .search-result-run {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      cursor: pointer;
    }

    .search-result-run .sr-meta {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: ${monoFont};
    }

    /* ── Nav badge variants ──────────────────────────────── */
    .nav-badge-error {
      background: #fee2e2;
      color: #991b1b;
    }

    /* ── Axe violation badge on test cards ───────────────── */
    .axe-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .axe-badge-clean {
      background: #d1fae5;
      color: #065f46;
    }
    .axe-badge-violations {
      background: #fee2e2;
      color: #991b1b;
    }

    /* ── Accessibility view panel ────────────────────────── */
    .a11y-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .a11y-summary-bar {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .a11y-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 1rem 1.5rem;
      min-width: 110px;
    }

    .a11y-stat-value {
      font-size: 2rem;
      font-weight: 700;
      font-family: ${monoFont};
      color: var(--text-primary);
    }

    .a11y-stat-violations { color: #dc2626; }
    .a11y-stat-clean      { color: #059669; }

    .a11y-stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-top: 0.25rem;
      white-space: nowrap;
    }

    .a11y-all-clear {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2.5rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      text-align: center;
    }
    .a11y-all-clear-icon  { font-size: 2.5rem; }
    .a11y-all-clear-title { font-size: 1.1rem; font-weight: 600; color: #065f46; }
    .a11y-all-clear-sub   { font-size: 0.85rem; color: #059669; }

    .a11y-section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    /* Rule breakdown table */
    .a11y-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .a11y-table th {
      text-align: left;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      padding: 0.4rem 0.75rem;
      border-bottom: 2px solid var(--border-subtle);
    }
    .a11y-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: top;
    }
    .a11y-table tr:last-child td { border-bottom: none; }
    .a11y-table tr:hover td { background: var(--bg-secondary); }

    .a11y-rule-id {
      font-family: ${monoFont};
      font-size: 0.8rem;
      background: var(--bg-secondary);
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
    }

    .a11y-count {
      font-weight: 600;
      font-family: ${monoFont};
      text-align: center;
    }

    .a11y-test-titles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .a11y-test-title-chip {
      font-size: 0.72rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      padding: 0.1rem 0.4rem;
      color: var(--text-secondary);
    }

    /* Impact severity badges */
    .a11y-impact {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      text-transform: capitalize;
    }
    .a11y-impact-critical { background: #fee2e2; color: #991b1b; }
    .a11y-impact-serious  { background: #ffedd5; color: #9a3412; }
    .a11y-impact-moderate { background: #fef9c3; color: #854d0e; }
    .a11y-impact-minor    { background: #e0f2fe; color: #075985; }
    .a11y-impact-unknown  { background: var(--bg-secondary); color: var(--text-muted); }

    /* Affected tests list */
    .a11y-test-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .a11y-test-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
    }
    .a11y-test-item-left {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }
    .a11y-test-violation-count {
      font-size: 1.4rem;
      font-weight: 700;
      font-family: ${monoFont};
      color: #dc2626;
      min-width: 2rem;
      text-align: center;
      flex-shrink: 0;
    }
    .a11y-test-item-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      word-break: break-word;
    }
    .a11y-test-item-file {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: ${monoFont};
      word-break: break-all;
      margin: 0.15rem 0;
    }
    .a11y-test-item-rules {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }
    .a11y-view-test-btn {
      flex-shrink: 0;
      font-size: 0.75rem;
      padding: 0.3rem 0.7rem;
      border: 1px solid var(--border-subtle);
      border-radius: 5px;
      background: var(--bg-primary);
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s, color 0.15s;
    }
    .a11y-view-test-btn:hover {
      background: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
    }

    /* Trend chart */
    .a11y-chart-container {
      max-width: 600px;
      height: 200px;
    }
`;
}
