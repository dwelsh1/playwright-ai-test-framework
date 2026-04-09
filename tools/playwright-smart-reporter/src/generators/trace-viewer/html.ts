/**
 * Generate the embedded trace viewer HTML and styles
 */
export function generateTraceViewerHtml(): string {
  return `
  <div id="traceViewerModal" class="trace-modal" onclick="if(event.target === this) closeTraceModal()">
    <div class="trace-modal-content">
      <div class="trace-modal-header">
        <h3 class="trace-modal-title">
          <span class="trace-modal-icon">📊</span>
          <span id="traceViewerTitle">Trace Viewer</span>
        </h3>
        <div class="trace-header-controls">
          <button class="trace-btn trace-btn-small trace-btn-secondary" onclick="toggleFullscreen()" title="Toggle fullscreen">
            <span id="fullscreenIcon">⛶</span>
          </button>
          <button class="trace-modal-close" onclick="closeTraceModal()" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="trace-modal-body">
        <!-- Loading State -->
        <div id="traceLoading" class="trace-loading">
          <div class="trace-loading-spinner"></div>
          <p>Loading trace...</p>
        </div>

        <!-- Error State -->
        <div id="traceError" class="trace-error" style="display: none;">
          <div class="trace-error-icon">⚠️</div>
          <p id="traceErrorMessage">Failed to load trace</p>
          <div class="trace-error-actions">
            <button onclick="document.getElementById('traceFileInput').click()" class="trace-btn">
              📁 Load from file
            </button>
            <button id="traceCopyCmd" class="trace-btn trace-btn-secondary">
              📋 Copy CLI command
            </button>
          </div>
          <input type="file" id="traceFileInput" accept=".zip" style="display: none;" onchange="loadTraceFromFile(this.files[0])">
        </div>

        <!-- Trace Content -->
        <div id="traceContent" class="trace-content" style="display: none;">
          <!-- Timeline Filmstrip with Slider -->
          <div id="traceTimeline" class="trace-timeline">
            <div class="trace-timeline-scroll" id="traceTimelineScroll">
              <!-- Thumbnails inserted by JS -->
            </div>
            <div class="trace-timeline-slider-track" id="traceSliderTrack">
              <div class="trace-timeline-slider-thumb" id="traceSliderThumb"></div>
              <div class="trace-timeline-slider-progress" id="traceSliderProgress"></div>
            </div>
            <!-- Hover magnification preview -->
            <div class="trace-timeline-magnifier" id="traceTimelineMagnifier" style="display: none;">
              <img id="traceMagnifierImg" src="" alt="Preview" />
              <div class="trace-magnifier-time" id="traceMagnifierTime"></div>
            </div>
          </div>

          <div class="trace-layout">
            <!-- Actions Panel -->
            <div class="trace-actions-panel" id="traceActionsPanel">
              <div class="trace-actions-header">
                <span>Actions</span>
                <span id="traceActionCount" class="trace-count"></span>
              </div>
              <!-- Action Search -->
              <div class="trace-search-wrapper">
                <input type="text" id="traceActionSearch" class="trace-search-input" placeholder="Filter actions..." oninput="filterTraceActions(this.value)">
                <button class="trace-search-clear" id="traceSearchClear" onclick="clearActionSearch()" style="display: none;">&times;</button>
              </div>
              <div id="traceActionsList" class="trace-actions-list"></div>
            </div>

            <!-- Resizer -->
            <div class="trace-resizer" id="traceResizer"></div>

            <!-- Main View -->
            <div class="trace-main-panel">
              <!-- Screenshot/Preview with Before/After controls -->
              <div class="trace-screenshot-panel">
                <div class="trace-snapshot-controls" id="traceSnapshotControls" style="display: none;">
                  <button class="trace-snapshot-btn active" data-snapshot="after" onclick="switchSnapshot('after')">
                    After
                  </button>
                  <button class="trace-snapshot-btn" data-snapshot="before" onclick="switchSnapshot('before')">
                    Before
                  </button>
                  <span class="trace-snapshot-hint">Press B/A keys</span>
                </div>
                <div class="trace-screenshot-container" id="traceScreenshotContainer">
                  <img id="traceScreenshot" class="trace-screenshot" src="" alt="Action screenshot" />
                  <!-- Click position indicator -->
                  <div id="traceClickIndicator" class="trace-click-indicator" style="display: none;">
                    <div class="trace-click-dot"></div>
                    <div class="trace-click-ripple"></div>
                  </div>
                  <div id="traceNoScreenshot" class="trace-no-screenshot">
                    <span>No screenshot for this action</span>
                  </div>
                </div>
              </div>

              <!-- Details Tabs -->
              <div class="trace-details-panel">
                <div class="trace-tabs">
                  <button class="trace-tab active" data-tab="details" onclick="switchTraceTab('details')">Details</button>
                  <button class="trace-tab" data-tab="console" onclick="switchTraceTab('console')">
                    Console
                    <span id="traceConsoleCount" class="trace-tab-badge" style="display: none;"></span>
                  </button>
                  <button class="trace-tab" data-tab="source" onclick="switchTraceTab('source')">Source</button>
                  <button class="trace-tab" data-tab="network" onclick="switchTraceTab('network')">Network</button>
                  <button class="trace-tab" data-tab="metadata" onclick="switchTraceTab('metadata')">Metadata</button>
                  <button class="trace-tab" data-tab="errors" onclick="switchTraceTab('errors')">
                    Errors
                    <span id="traceErrorCount" class="trace-tab-badge trace-tab-badge-error" style="display: none;"></span>
                  </button>
                  <button class="trace-tab" data-tab="attachments" onclick="switchTraceTab('attachments')">
                    Attachments
                    <span id="traceAttachmentCount" class="trace-tab-badge" style="display: none;"></span>
                  </button>
                </div>
                <div class="trace-tab-content">
                  <div id="traceTabDetails" class="trace-tab-pane active">
                    <div id="traceDetailsContent"></div>
                  </div>
                  <div id="traceTabConsole" class="trace-tab-pane">
                    <div class="trace-console-controls">
                      <button class="trace-console-filter active" data-level="all" onclick="filterConsole('all')">All</button>
                      <button class="trace-console-filter" data-level="error" onclick="filterConsole('error')">Errors</button>
                      <button class="trace-console-filter" data-level="warning" onclick="filterConsole('warning')">Warnings</button>
                      <button class="trace-console-filter" data-level="log" onclick="filterConsole('log')">Info</button>
                    </div>
                    <div id="traceConsoleContent"></div>
                  </div>
                  <div id="traceTabSource" class="trace-tab-pane">
                    <div id="traceSourceContent"></div>
                  </div>
                  <div id="traceTabNetwork" class="trace-tab-pane">
                    <div class="trace-network-controls">
                      <input type="text" id="traceNetworkSearch" class="trace-network-search" placeholder="Filter by URL..." oninput="filterNetwork(this.value)">
                      <div class="trace-network-filters">
                        <button class="trace-network-filter active" data-type="all" onclick="filterNetworkType('all')">All</button>
                        <button class="trace-network-filter" data-type="xhr" onclick="filterNetworkType('xhr')">XHR</button>
                        <button class="trace-network-filter" data-type="doc" onclick="filterNetworkType('doc')">Doc</button>
                        <button class="trace-network-filter" data-type="css" onclick="filterNetworkType('css')">CSS</button>
                        <button class="trace-network-filter" data-type="js" onclick="filterNetworkType('js')">JS</button>
                        <button class="trace-network-filter" data-type="img" onclick="filterNetworkType('img')">Img</button>
                      </div>
                    </div>
                    <div id="traceNetworkContent"></div>
                  </div>
                  <div id="traceTabMetadata" class="trace-tab-pane">
                    <div id="traceMetadataContent"></div>
                  </div>
                  <div id="traceTabErrors" class="trace-tab-pane">
                    <div id="traceErrorsContent"></div>
                  </div>
                  <div id="traceTabAttachments" class="trace-tab-pane">
                    <div id="traceAttachmentsContent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}
