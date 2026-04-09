/**
 * Generate trace viewer styles
 */
export function generateTraceViewerStyles(monoFont: string): string {
  return `
    /* Trace Viewer Modal */
    .trace-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }

    .trace-modal.fullscreen {
      padding: 0;
    }

    .trace-modal.fullscreen .trace-modal-content {
      width: 100%;
      height: 100%;
      max-width: none;
      border-radius: 0;
    }

    .trace-modal-content {
      background: var(--bg-primary);
      border-radius: 12px;
      width: 95%;
      height: 92%;
      max-width: 1600px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }

    .trace-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-subtle);
    }

    .trace-modal-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .trace-modal-icon {
      font-size: 1.2rem;
    }

    .trace-header-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .trace-modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      line-height: 1;
      transition: color 0.2s;
      border-radius: 4px;
    }

    .trace-modal-close:hover {
      color: var(--accent-red);
      background: rgba(255, 100, 100, 0.1);
    }

    .trace-modal-body {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* Loading State */
    .trace-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: var(--text-muted);
    }

    .trace-loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-subtle);
      border-top-color: var(--accent-blue);
      border-radius: 50%;
      animation: trace-spin 1s linear infinite;
    }

    @keyframes trace-spin {
      to { transform: rotate(360deg); }
    }

    /* Error State */
    .trace-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }

    .trace-error-icon {
      font-size: 3rem;
    }

    .trace-error p {
      color: var(--text-secondary);
      margin: 0;
    }

    .trace-error-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .trace-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      background: var(--accent-blue);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .trace-btn:hover {
      background: var(--accent-blue-hover, #0095e0);
      transform: translateY(-1px);
    }

    .trace-btn-small {
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
    }

    .trace-btn-secondary {
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
    }

    .trace-btn-secondary:hover {
      background: var(--bg-card-hover);
      border-color: var(--accent-blue);
    }

    /* Timeline Filmstrip */
    .trace-timeline {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.5rem;
      height: 72px;
      overflow: hidden;
    }

    .trace-timeline-scroll {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      height: 100%;
      align-items: center;
      padding: 0 0.5rem;
      scroll-behavior: smooth;
    }

    .trace-timeline-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .trace-timeline-scroll::-webkit-scrollbar-thumb {
      background: var(--border-subtle);
      border-radius: 3px;
    }

    .trace-timeline-thumb {
      flex-shrink: 0;
      width: 80px;
      height: 56px;
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      border: 3px solid transparent;
      transition: all 0.2s ease;
      position: relative;
      background: #1a1a2e;
      opacity: 0.6;
    }

    .trace-timeline-thumb:hover {
      border-color: var(--accent-blue);
      transform: scale(1.08);
      opacity: 0.9;
    }

    .trace-timeline-thumb.active {
      border-color: #00d4ff;
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.3);
      transform: scale(1.1);
      opacity: 1;
      z-index: 10;
    }

    .trace-timeline-thumb.active::before {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 2px solid #00d4ff;
      border-radius: 6px;
      animation: timeline-pulse 1.5s ease-in-out infinite;
    }

    @keyframes timeline-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .trace-timeline-thumb.has-error {
      border-color: var(--accent-red);
    }

    .trace-timeline-thumb.has-error.active {
      border-color: var(--accent-red);
      box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.4), 0 0 20px rgba(255, 107, 107, 0.3);
    }

    .trace-timeline-thumb.has-error::after {
      content: '●';
      position: absolute;
      top: 2px;
      right: 4px;
      color: var(--accent-red);
      font-size: 0.7rem;
      text-shadow: 0 0 4px var(--accent-red);
    }

    .trace-timeline-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .trace-timeline-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 0.6rem;
    }

    /* Timeline Slider */
    .trace-timeline-slider-track {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--border-subtle);
      cursor: pointer;
    }

    .trace-timeline-slider-progress {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: var(--accent-blue);
      pointer-events: none;
      width: 0%;
    }

    .trace-timeline-slider-thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 12px;
      height: 12px;
      background: var(--accent-blue);
      border: 2px solid white;
      border-radius: 50%;
      cursor: grab;
      z-index: 2;
      left: 0%;
    }

    .trace-timeline-slider-thumb:active {
      cursor: grabbing;
      transform: translate(-50%, -50%) scale(1.2);
    }

    /* Timeline Magnifier */
    .trace-timeline-magnifier {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 100;
      pointer-events: none;
    }

    .trace-timeline-magnifier img {
      width: 200px;
      height: 140px;
      object-fit: contain;
      border-radius: 4px;
    }

    .trace-magnifier-time {
      text-align: center;
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Click Position Indicator */
    .trace-click-indicator {
      position: absolute;
      pointer-events: none;
      z-index: 10;
    }

    .trace-click-dot {
      width: 12px;
      height: 12px;
      background: rgba(255, 0, 0, 0.8);
      border: 2px solid white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .trace-click-ripple {
      width: 30px;
      height: 30px;
      border: 2px solid rgba(255, 0, 0, 0.5);
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: trace-click-ripple 1.5s ease-out infinite;
    }

    @keyframes trace-click-ripple {
      0% {
        width: 12px;
        height: 12px;
        opacity: 1;
      }
      100% {
        width: 40px;
        height: 40px;
        opacity: 0;
      }
    }

    /* Trace Content Layout */
    .trace-content {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .trace-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Actions Panel */
    .trace-actions-panel {
      width: 280px;
      min-width: 200px;
      max-width: 400px;
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary);
    }

    .trace-actions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-subtle);
    }

    .trace-count {
      background: var(--bg-primary);
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      font-size: 0.7rem;
    }

    /* Action Search */
    .trace-search-wrapper {
      position: relative;
      padding: 0.5rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-subtle);
    }

    .trace-search-input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 0.8rem;
      outline: none;
    }

    .trace-search-input:focus {
      border-color: var(--accent-blue);
    }

    .trace-search-clear {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
    }

    .trace-search-clear:hover {
      color: var(--text-primary);
    }

    .trace-actions-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .trace-action-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      margin-bottom: 0.25rem;
    }

    .trace-action-item:hover {
      background: var(--bg-card-hover);
    }

    .trace-action-item.active {
      background: var(--accent-blue);
      color: white;
    }

    .trace-action-item.active .trace-action-time,
    .trace-action-item.active .trace-action-selector {
      color: rgba(255, 255, 255, 0.8);
    }

    .trace-action-item.has-error {
      border-left: 3px solid var(--accent-red);
    }

    .trace-action-item.filtered-out {
      display: none;
    }

    .trace-action-icon {
      font-size: 1rem;
      flex-shrink: 0;
      width: 24px;
      text-align: center;
    }

    .trace-action-info {
      flex: 1;
      min-width: 0;
    }

    .trace-action-name {
      font-size: 0.8rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .trace-action-name mark {
      background: rgba(255, 200, 50, 0.4);
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
    }

    .trace-action-selector {
      font-family: ${monoFont};
      font-size: 0.7rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0.15rem;
    }

    .trace-action-time {
      font-family: ${monoFont};
      font-size: 0.65rem;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .trace-action-duration-bar {
      height: 3px;
      background: var(--accent-blue);
      border-radius: 2px;
      margin-top: 4px;
      opacity: 0.5;
    }

    .trace-action-item.active .trace-action-duration-bar {
      background: rgba(255, 255, 255, 0.5);
    }

    /* Resizer */
    .trace-resizer {
      width: 4px;
      background: var(--border-subtle);
      cursor: col-resize;
      transition: background 0.2s;
    }

    .trace-resizer:hover,
    .trace-resizer.active {
      background: var(--accent-blue);
    }

    /* Main Panel */
    .trace-main-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* Screenshot Panel */
    .trace-screenshot-panel {
      flex: 0 0 45%;
      min-height: 150px;
      max-height: 50%;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .trace-snapshot-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(0, 0, 0, 0.5);
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;
    }

    .trace-snapshot-btn {
      padding: 0.35rem 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .trace-snapshot-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .trace-snapshot-btn.active {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: white;
    }

    .trace-snapshot-hint {
      margin-left: auto;
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .trace-screenshot-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 1rem;
    }

    .trace-screenshot {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 4px;
    }

    .trace-screenshot.before-snapshot {
      border: 2px solid #f0ad4e;
    }

    .trace-screenshot.after-snapshot {
      border: 2px solid #5cb85c;
    }

    .trace-no-screenshot {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    /* Details Panel */
    .trace-details-panel {
      flex: 1;
      min-height: 200px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-primary);
    }

    .trace-tabs {
      display: flex;
      gap: 0;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0 0.5rem;
      flex-wrap: wrap;
    }

    .trace-tab {
      padding: 0.6rem 1rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .trace-tab:hover {
      color: var(--text-primary);
    }

    .trace-tab.active {
      color: var(--accent-blue);
      border-bottom-color: var(--accent-blue);
    }

    .trace-tab-badge {
      background: var(--accent-blue);
      color: white;
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 8px;
      min-width: 18px;
      text-align: center;
    }

    .trace-tab-badge-error {
      background: var(--accent-red);
    }

    .trace-tab-content {
      flex: 1;
      overflow: hidden;
    }

    .trace-tab-pane {
      display: none;
      height: 100%;
      overflow-y: auto;
      padding: 1rem;
    }

    .trace-tab-pane.active {
      display: block;
    }

    /* Details Content */
    .trace-detail-row {
      display: flex;
      gap: 1rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.8rem;
    }

    .trace-detail-row:last-child {
      border-bottom: none;
    }

    .trace-detail-label {
      color: var(--text-muted);
      width: 100px;
      flex-shrink: 0;
    }

    .trace-detail-value {
      color: var(--text-primary);
      font-family: ${monoFont};
      word-break: break-all;
    }

    /* Console Tab */
    .trace-console-controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .trace-console-filter {
      padding: 0.3rem 0.6rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-muted);
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .trace-console-filter:hover {
      border-color: var(--accent-blue);
    }

    .trace-console-filter.active {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: white;
    }

    .trace-console-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem;
      font-size: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }

    .trace-console-item.log {
      background: transparent;
    }

    .trace-console-item.info {
      background: rgba(0, 169, 255, 0.05);
      border-left: 3px solid var(--accent-blue);
    }

    .trace-console-item.warning {
      background: rgba(255, 193, 7, 0.1);
      border-left: 3px solid #ffc107;
    }

    .trace-console-item.error {
      background: rgba(255, 100, 100, 0.1);
      border-left: 3px solid var(--accent-red);
    }

    .trace-console-item.debug {
      opacity: 0.6;
    }

    .trace-console-item.filtered-out {
      display: none;
    }

    .trace-console-icon {
      flex-shrink: 0;
      width: 16px;
      text-align: center;
    }

    .trace-console-time {
      font-family: ${monoFont};
      color: var(--text-muted);
      flex-shrink: 0;
      min-width: 50px;
    }

    .trace-console-message {
      font-family: ${monoFont};
      color: var(--text-primary);
      word-break: break-word;
      flex: 1;
    }

    .trace-console-location {
      font-family: ${monoFont};
      color: var(--text-muted);
      font-size: 0.65rem;
      flex-shrink: 0;
    }

    /* Source Tab */
    .trace-source-section {
      margin-bottom: 1.5rem;
    }

    .trace-source-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .trace-source-location {
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--text-primary);
      padding: 0.75rem;
      background: var(--bg-card);
      border-radius: 6px;
      border-left: 3px solid var(--accent-blue);
    }

    .trace-stack-frame {
      font-family: ${monoFont};
      font-size: 0.75rem;
      padding: 0.4rem 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
    }

    .trace-stack-frame:last-child {
      border-bottom: none;
    }

    .trace-stack-frame.user-code {
      color: var(--text-primary);
      background: var(--bg-card);
    }

    .trace-stack-file {
      color: var(--accent-blue);
    }

    .trace-stack-line {
      color: var(--accent-green);
    }

    /* Network Tab */
    .trace-network-controls {
      margin-bottom: 0.75rem;
    }

    .trace-network-search {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 0.8rem;
      outline: none;
      margin-bottom: 0.5rem;
    }

    .trace-network-search:focus {
      border-color: var(--accent-blue);
    }

    .trace-network-filters {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .trace-network-filter {
      padding: 0.25rem 0.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-muted);
      font-size: 0.65rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .trace-network-filter:hover {
      border-color: var(--accent-blue);
    }

    .trace-network-filter.active {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: white;
    }

    .trace-network-list {
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      overflow: hidden;
    }

    .trace-network-header {
      display: grid;
      grid-template-columns: 60px 1fr 200px 50px 60px;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-card);
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      border-bottom: 1px solid var(--border-subtle);
    }

    .trace-network-header-cell {
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .trace-network-header-cell:hover {
      color: var(--text-primary);
    }

    .trace-network-header-cell.sorted {
      color: var(--accent-blue);
    }

    .trace-network-sort-icon {
      font-size: 0.5rem;
      opacity: 0.5;
    }

    .trace-network-header-cell.sorted .trace-network-sort-icon {
      opacity: 1;
    }

    .trace-network-item {
      display: grid;
      grid-template-columns: 60px 1fr 200px 50px 60px;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
      align-items: center;
      cursor: pointer;
      transition: background 0.15s;
    }

    .trace-network-item:hover {
      background: var(--bg-card-hover);
    }

    .trace-network-item:last-child {
      border-bottom: none;
    }

    .trace-network-item.filtered-out {
      display: none;
    }

    .trace-network-item.expanded {
      background: var(--bg-card);
    }

    .trace-network-method {
      font-family: ${monoFont};
      font-weight: 600;
      color: var(--accent-blue);
    }

    .trace-network-method.post { color: #4caf50; }
    .trace-network-method.put { color: #ff9800; }
    .trace-network-method.delete { color: #f44336; }
    .trace-network-method.patch { color: #9c27b0; }

    .trace-network-url {
      font-family: ${monoFont};
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .trace-network-waterfall {
      height: 16px;
      display: flex;
      align-items: center;
      position: relative;
    }

    .trace-waterfall-bar {
      height: 8px;
      border-radius: 2px;
      position: absolute;
      min-width: 2px;
    }

    .trace-waterfall-dns { background: #8bc34a; }
    .trace-waterfall-connect { background: #ff9800; }
    .trace-waterfall-ssl { background: #9c27b0; }
    .trace-waterfall-wait { background: #2196f3; }
    .trace-waterfall-receive { background: #00bcd4; }

    .trace-network-status {
      font-family: ${monoFont};
      text-align: center;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .trace-network-status.success {
      background: rgba(0, 200, 100, 0.2);
      color: var(--accent-green);
    }

    .trace-network-status.redirect {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }

    .trace-network-status.error {
      background: rgba(255, 100, 100, 0.2);
      color: var(--accent-red);
    }

    .trace-network-time {
      font-family: ${monoFont};
      color: var(--text-muted);
      text-align: right;
    }

    /* Network Details (expanded) */
    .trace-network-details {
      grid-column: 1 / -1;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-subtle);
      display: none;
    }

    .trace-network-item.expanded .trace-network-details {
      display: block;
    }

    .trace-network-details-section {
      margin-bottom: 1rem;
    }

    .trace-network-details-section:last-child {
      margin-bottom: 0;
    }

    .trace-network-details-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .trace-network-details-title::before {
      content: '▶';
      font-size: 0.5rem;
      transition: transform 0.15s;
    }

    .trace-network-details-section.expanded .trace-network-details-title::before {
      transform: rotate(90deg);
    }

    .trace-network-details-content {
      display: none;
      font-family: ${monoFont};
      font-size: 0.75rem;
      background: var(--bg-primary);
      border-radius: 4px;
      padding: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .trace-network-details-section.expanded .trace-network-details-content {
      display: block;
    }

    .trace-header-row {
      display: flex;
      padding: 0.2rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }

    .trace-header-row:last-child {
      border-bottom: none;
    }

    .trace-header-name {
      color: var(--accent-blue);
      min-width: 180px;
      flex-shrink: 0;
    }

    .trace-header-value {
      color: var(--text-primary);
      word-break: break-all;
    }

    .trace-request-body {
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--text-primary);
    }

    /* Metadata Tab */
    .trace-metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .trace-metadata-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 1rem;
    }

    .trace-metadata-card-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .trace-metadata-row {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.8rem;
    }

    .trace-metadata-row:last-child {
      border-bottom: none;
    }

    .trace-metadata-label {
      color: var(--text-muted);
    }

    .trace-metadata-value {
      color: var(--text-primary);
      font-family: ${monoFont};
      text-align: right;
    }

    /* Errors Tab */
    .trace-error-item {
      background: rgba(255, 100, 100, 0.1);
      border: 1px solid rgba(255, 100, 100, 0.3);
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .trace-error-action {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .trace-error-name {
      font-weight: 600;
      color: var(--accent-red);
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }

    .trace-error-message {
      font-family: ${monoFont};
      font-size: 0.8rem;
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .trace-empty {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-align: center;
      padding: 2rem;
    }

    /* Waterfall legend */
    .trace-waterfall-legend {
      display: flex;
      gap: 1rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-card);
      border-top: 1px solid var(--border-subtle);
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    .trace-waterfall-legend-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .trace-waterfall-legend-color {
      width: 12px;
      height: 8px;
      border-radius: 2px;
    }

    /* Attachments Tab */
    .trace-attachments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .trace-attachment-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.15s;
    }

    .trace-attachment-card:hover {
      border-color: var(--accent-blue);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .trace-attachment-preview {
      height: 120px;
      background: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .trace-attachment-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .trace-attachment-preview-icon {
      font-size: 2.5rem;
      opacity: 0.5;
    }

    .trace-attachment-info {
      padding: 0.75rem;
    }

    .trace-attachment-name {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }

    .trace-attachment-meta {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .trace-attachment-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .trace-attachment-btn {
      flex: 1;
      padding: 0.35rem 0.5rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-secondary);
      font-size: 0.7rem;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }

    .trace-attachment-btn:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: white;
    }

    /* Image comparison slider */
    .trace-image-compare {
      position: relative;
      overflow: hidden;
      border-radius: 6px;
    }

    .trace-image-compare img {
      display: block;
      width: 100%;
    }

    .trace-image-compare-overlay {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 50%;
      overflow: hidden;
      border-right: 2px solid var(--accent-blue);
    }

    .trace-image-compare-overlay img {
      position: absolute;
      top: 0;
      left: 0;
      width: 200%;
    }

    .trace-image-compare-slider {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--accent-blue);
      cursor: ew-resize;
      left: 50%;
      transform: translateX(-50%);
    }

    .trace-image-compare-slider::before {
      content: '⟷';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--accent-blue);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
    }
  `;
}
