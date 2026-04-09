/**
 * Generate trace viewer JavaScript
 */
export function generateTraceViewerScript(): string {
  return `
    // Trace Viewer State
    let traceData = null;
    let traceResources = {};
    let traceScreenshots = new Map();
    let traceAttachments = [];
    let currentActionIndex = 0;
    let currentTracePath = '';
    let currentSnapshotMode = 'after';
    let currentConsoleFilter = 'all';
    let currentNetworkFilter = '';
    let currentNetworkType = 'all';
    let actionSearchTerm = '';
    let maxActionDuration = 0;

    // JSZip is inlined below - no CDN required
    let JSZip = null;

    function initJSZip() {
      if (JSZip) return;
      if (window.JSZip) {
        JSZip = window.JSZip;
        return;
      }
    }

    async function loadJSZip() {
      if (JSZip) return JSZip;
      if (window.JSZip) {
        JSZip = window.JSZip;
        return JSZip;
      }
      throw new Error('JSZip not available');
    }

    function viewTraceFromEl(el) {
      const tracePath = el.dataset.trace;
      if (tracePath) {
        openTraceModal(tracePath);
      }
      return false;
    }

    async function openTraceModal(tracePath) {
      const modal = document.getElementById('traceViewerModal');
      if (!modal) return;

      currentTracePath = tracePath;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Update title
      const title = document.getElementById('traceViewerTitle');
      if (title) {
        const fileName = tracePath.split(/[\\\\/]/).pop() || 'Trace';
        title.textContent = fileName;
      }

      // Show loading
      showTraceState('loading');

      // Set up copy command button
      const copyCmd = document.getElementById('traceCopyCmd');
      if (copyCmd) {
        copyCmd.onclick = () => {
          const cmd = 'npx playwright show-trace "' + tracePath + '"';
          navigator.clipboard.writeText(cmd).then(() => {
            copyCmd.textContent = '✓ Copied!';
            setTimeout(() => { copyCmd.textContent = '📋 Copy CLI command'; }, 2000);
          }).catch(() => {
            window.prompt('Run this command:', cmd);
          });
        };
      }

      // file:// protocol cannot use fetch for local files due to browser security
      if (window.location.protocol === 'file:') {
        showTraceError('Cannot load traces via file://. Run: npx playwright-smart-reporter-serve to view with full trace support, or use "Load from file" below.');
        return;
      }

      try {
        console.log('[TraceViewer] Loading JSZip...');
        await loadJSZip();
        console.log('[TraceViewer] JSZip loaded, fetching trace:', tracePath);

        // Fetch the trace file
        const response = await fetch(tracePath);
        console.log('[TraceViewer] Fetch response:', response.status, response.statusText);
        if (!response.ok) throw new Error('Failed to fetch trace: ' + response.status + ' ' + response.statusText);

        const blob = await response.blob();
        console.log('[TraceViewer] Blob size:', blob.size);
        await loadTraceFromBlob(blob);
        console.log('[TraceViewer] Trace loaded successfully');
      } catch (err) {
        console.error('[TraceViewer] Error:', err);
        showTraceError(err.message || 'Failed to load trace');
      }
    }

    async function loadTraceFromFile(file) {
      if (!file) return;
      showTraceState('loading');
      try {
        await loadJSZip();
        await loadTraceFromBlob(file);
      } catch (err) {
        showTraceError(err.message || 'Failed to load trace file');
      }
    }

    async function loadTraceFromBlob(blob) {
      const zip = await JSZip.loadAsync(blob);

      // Find and parse trace file
      let traceContent = null;
      for (const fileName of Object.keys(zip.files)) {
        if (fileName.endsWith('-trace.trace') || fileName === 'trace.trace') {
          traceContent = await zip.files[fileName].async('string');
          break;
        }
      }

      if (!traceContent) {
        if (zip.files['0-trace.trace']) {
          traceContent = await zip.files['0-trace.trace'].async('string');
        }
      }

      if (!traceContent) {
        throw new Error('No trace data found in ZIP');
      }

      // Parse NDJSON trace
      const events = traceContent.trim().split('\\n').map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);

      // Extract resources (screenshots)
      traceResources = {};
      traceScreenshots = new Map();
      for (const fileName of Object.keys(zip.files)) {
        if (fileName.startsWith('resources/')) {
          const key = fileName.split('/').pop();
          if (fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
            const data = await zip.files[fileName].async('base64');
            const ext = fileName.endsWith('.png') ? 'png' : 'jpeg';
            traceResources[key] = 'data:image/' + ext + ';base64,' + data;
          }
        }
      }

      // Parse stack traces if available
      // Format: {"files":["path1.ts"], "stacks":[[callId, [[fileIdx, line, col, func]]]]}
      let stackData = { files: [], stacks: [] };
      if (zip.files['0-trace.stacks']) {
        try {
          const stackContent = await zip.files['0-trace.stacks'].async('string');
          stackData = JSON.parse(stackContent);
        } catch (e) {
          console.warn('[TraceViewer] Failed to parse stacks:', e);
        }
      }

      // Parse network data if available
      // Format: NDJSON with {"type":"resource-snapshot","snapshot":{...HAR entry...}}
      let networkData = [];
      if (zip.files['0-trace.network']) {
        try {
          const networkContent = await zip.files['0-trace.network'].async('string');
          const lines = networkContent.trim().split('\\n');
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              if (entry.type === 'resource-snapshot' && entry.snapshot) {
                const snap = entry.snapshot;
                const req = snap.request || {};
                const res = snap.response || {};
                const timings = snap.timings || {};
                networkData.push({
                  method: req.method || 'GET',
                  url: req.url || '',
                  status: res.status || 0,
                  statusText: res.statusText || '',
                  time: snap.time || 0,
                  startedDateTime: snap.startedDateTime,
                  timings: {
                    dns: Math.max(0, timings.dns || 0),
                    connect: Math.max(0, timings.connect || 0),
                    ssl: Math.max(0, timings.ssl || 0),
                    wait: Math.max(0, timings.wait || 0),
                    receive: Math.max(0, timings.receive || 0)
                  },
                  requestHeaders: req.headers || [],
                  responseHeaders: res.headers || [],
                  requestBody: req.postData?.text || null,
                  responseSize: res.content?.size || res.bodySize || 0,
                  mimeType: res.content?.mimeType || ''
                });
              }
            } catch {}
          }
        } catch (e) {
          console.warn('[TraceViewer] Failed to parse network data:', e);
        }
      }

      // Process trace data
      traceData = processTraceEvents(events, networkData, stackData);

      // Render
      renderTraceViewer();
      showTraceState('content');
    }

    function processTraceEvents(events, networkData, stackData) {
      const actions = [];
      const logs = [];
      const errors = [];
      const consoleEntries = [];
      const screenshots = new Map();
      let contextInfo = null;
      let metadata = {
        browserName: 'Unknown',
        browserVersion: '',
        viewport: { width: 0, height: 0 },
        platform: 'Unknown',
        locale: '',
        testName: '',
        testFile: '',
        duration: 0
      };

      // Build stack map by callId number
      // Format: stackData = {files: ["path.ts"], stacks: [[callIdNum, [[fileIdx, line, col, func]]]]}
      const stackMap = new Map();
      const stackFiles = stackData.files || [];
      for (const [callIdNum, frames] of (stackData.stacks || [])) {
        // Convert compact frame format to objects
        const frameObjects = (frames || []).map(f => ({
          file: stackFiles[f[0]] || 'unknown',
          line: f[1] || 0,
          column: f[2] || 0,
          function: f[3] || ''
        }));
        stackMap.set(callIdNum, frameObjects);
      }

      // First pass: collect screenshots and context info
      for (const event of events) {
        if (event.type === 'screencast-frame') {
          screenshots.set(event.timestamp, {
            sha1: event.sha1,
            timestamp: event.timestamp
          });
          traceScreenshots.set(event.timestamp, event.sha1);
        }
        if (event.type === 'context-options') {
          contextInfo = event;
          if (event.browserName) metadata.browserName = event.browserName;
          if (event.browserVersion) metadata.browserVersion = event.browserVersion;
          if (event.viewport) metadata.viewport = event.viewport;
          if (event.platform) metadata.platform = event.platform;
          if (event.locale) metadata.locale = event.locale;
        }
        if (event.type === 'stdio') {
          consoleEntries.push({
            type: event.messageType || 'log',
            text: event.text || '',
            timestamp: event.timestamp || 0,
            location: event.location || ''
          });
        }
        if (event.type === 'console') {
          consoleEntries.push({
            type: event.messageType || 'log',
            text: event.text || (event.args ? event.args.map(a => a.preview || a.value || '').join(' ') : ''),
            timestamp: event.timestamp || 0,
            location: event.location ? event.location.url + ':' + event.location.lineNumber : ''
          });
        }
      }

      // Second pass: build actions
      const beforeEvents = new Map();
      let startTime = Infinity;
      let endTime = 0;

      for (const event of events) {
        if (event.type === 'before') {
          beforeEvents.set(event.callId, event);
          if (event.startTime < startTime) startTime = event.startTime;
        }
        if (event.type === 'after') {
          const before = beforeEvents.get(event.callId);
          if (before) {
            if (event.endTime > endTime) endTime = event.endTime;

            const action = {
              callId: event.callId,
              class: before.class,
              method: before.method,
              params: before.params,
              startTime: before.startTime,
              endTime: event.endTime,
              duration: Math.round(event.endTime - before.startTime),
              result: event.result,
              error: event.error,
              title: before.title || (before.class + '.' + before.method),
              beforeSnapshot: before.beforeSnapshot,
              afterSnapshot: event.afterSnapshot,
              // callId is like "call@23" - extract the number to match stackMap
              stack: stackMap.get(parseInt(event.callId.split('@')[1]) || 0) || [],
              point: event.point
            };

            // Find screenshots for before/after the action
            // Before: latest screenshot taken before the action started
            // After: first screenshot taken after the action completed
            let closestBeforeScreenshot = null;
            let closestAfterScreenshot = null;
            let closestBeforeTime = -Infinity;

            const sortedScreenshots = Array.from(screenshots.entries()).sort((a, b) => a[0] - b[0]);

            for (const [ts, data] of sortedScreenshots) {
              // Before: latest screenshot before action started
              if (ts < before.startTime) {
                if (ts > closestBeforeTime) {
                  closestBeforeTime = ts;
                  closestBeforeScreenshot = data.sha1;
                }
              }
              // After: first screenshot at or after action END time (when action completed)
              if (ts >= event.endTime && !closestAfterScreenshot) {
                closestAfterScreenshot = data.sha1;
              }
            }

            // If we still don't have an after screenshot, use the last screenshot before
            if (!closestAfterScreenshot && closestBeforeScreenshot) {
              closestAfterScreenshot = closestBeforeScreenshot;
            }

            // If we don't have a before screenshot, use the first after screenshot
            if (!closestBeforeScreenshot && closestAfterScreenshot) {
              closestBeforeScreenshot = closestAfterScreenshot;
            }

            action.beforeScreenshot = closestBeforeScreenshot;
            action.afterScreenshot = closestAfterScreenshot;
            action.screenshot = closestAfterScreenshot || closestBeforeScreenshot;

            actions.push(action);

            if (event.error) {
              errors.push({
                action: action.title,
                name: event.error.name || 'Error',
                message: event.error.message || 'Unknown error',
                stack: event.error.stack || ''
              });
            }
          }
        }
        if (event.type === 'log') {
          logs.push({
            time: event.time,
            message: event.message
          });
        }
      }

      // Calculate metadata duration
      metadata.duration = endTime - startTime;

      // Calculate max duration for relative bars
      maxActionDuration = Math.max(...actions.map(a => a.duration), 1);

      // Sort console entries by timestamp
      consoleEntries.sort((a, b) => a.timestamp - b.timestamp);

      return {
        actions,
        logs,
        errors,
        network: networkData,
        console: consoleEntries,
        metadata,
        contextInfo,
        startTime,
        endTime
      };
    }

    function renderTraceViewer() {
      if (!traceData) return;

      // Render timeline
      renderTimeline();

      // Render actions list
      renderActionsList();

      // Update count
      const countEl = document.getElementById('traceActionCount');
      if (countEl) countEl.textContent = traceData.actions.length;

      // Select first action
      if (traceData.actions.length > 0) {
        selectTraceAction(0);
      }

      // Render static tabs
      renderErrorsTab();
      renderMetadataTab();
      renderNetworkTab();
      renderConsoleTab();
      renderAttachmentsTab();

      // Update badges
      updateTabBadges();

      // Set up panel resizing
      setupPanelResizer();

      // Set up timeline slider
      setupTimelineSlider();

      // Set up timeline hover magnification
      setupTimelineMagnifier();
    }

    function renderTimeline() {
      const container = document.getElementById('traceTimelineScroll');
      if (!container || !traceData) return;

      // Get all unique screenshots in order
      const screenshotTimes = Array.from(traceScreenshots.keys()).sort((a, b) => a - b);

      // Sample if too many (show ~20-30 thumbnails)
      let sampled = screenshotTimes;
      if (screenshotTimes.length > 30) {
        const step = Math.ceil(screenshotTimes.length / 30);
        sampled = screenshotTimes.filter((_, i) => i % step === 0);
      }

      // Find which actions have errors
      const errorActionIndices = new Set(
        traceData.actions.map((a, i) => a.error ? i : -1).filter(i => i >= 0)
      );

      // Create thumbnail for each screenshot
      container.innerHTML = sampled.map((ts, idx) => {
        const sha1 = traceScreenshots.get(ts);
        const src = traceResources[sha1] || '';

        // Find closest action to this timestamp
        let closestActionIdx = 0;
        let closestDiff = Infinity;
        for (let i = 0; i < traceData.actions.length; i++) {
          const diff = Math.abs(traceData.actions[i].startTime - ts);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestActionIdx = i;
          }
        }

        const hasError = errorActionIndices.has(closestActionIdx);

        return \`
          <div class="trace-timeline-thumb \${hasError ? 'has-error' : ''}"
               data-index="\${closestActionIdx}"
               data-timestamp="\${ts}"
               onclick="jumpToTimelineFrame(\${closestActionIdx}, \${idx})">
            \${src ? \`<img src="\${src}" alt="Frame">\` : '<div class="trace-timeline-placeholder">No img</div>'}
          </div>
        \`;
      }).join('');
    }

    function jumpToTimelineFrame(actionIndex, thumbIndex) {
      selectTraceAction(actionIndex);

      // Update active state on timeline
      document.querySelectorAll('.trace-timeline-thumb').forEach((el, i) => {
        el.classList.toggle('active', i === thumbIndex);
      });
    }

    function renderActionsList() {
      const actionsList = document.getElementById('traceActionsList');
      if (!actionsList || !traceData) return;

      actionsList.innerHTML = traceData.actions.map((action, idx) => {
        const icon = getActionIcon(action.method);
        const selector = action.params?.selector || action.params?.url || '';
        const hasError = !!action.error;
        const durationPercent = (action.duration / maxActionDuration) * 100;

        return \`
          <div class="trace-action-item \${idx === 0 ? 'active' : ''} \${hasError ? 'has-error' : ''}"
               onclick="selectTraceAction(\${idx})" data-index="\${idx}">
            <span class="trace-action-icon">\${icon}</span>
            <div class="trace-action-info">
              <div class="trace-action-name">\${escapeHtmlTrace(action.title || action.method)}</div>
              \${selector ? \`<div class="trace-action-selector">\${escapeHtmlTrace(selector.substring(0, 50))}</div>\` : ''}
              <div class="trace-action-duration-bar" style="width: \${durationPercent}%"></div>
            </div>
            <span class="trace-action-time">\${action.duration}ms</span>
          </div>
        \`;
      }).join('');
    }

    function selectTraceAction(index) {
      if (!traceData || index >= traceData.actions.length) return;

      currentActionIndex = index;
      const action = traceData.actions[index];

      // Update active state in actions list
      document.querySelectorAll('.trace-action-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });

      // Scroll action into view
      const activeItem = document.querySelector('.trace-action-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      // Update timeline active state
      const timelineThumbs = document.querySelectorAll('.trace-timeline-thumb');
      let closestThumbIdx = 0;
      let closestDiff = Infinity;
      timelineThumbs.forEach((thumb, i) => {
        const thumbActionIdx = parseInt(thumb.dataset.index) || 0;
        const diff = Math.abs(thumbActionIdx - index);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestThumbIdx = i;
        }
      });
      timelineThumbs.forEach((el, i) => {
        el.classList.toggle('active', i === closestThumbIdx);
      });

      // Scroll timeline to active thumb
      const activeThumb = document.querySelector('.trace-timeline-thumb.active');
      if (activeThumb) {
        activeThumb.scrollIntoView({ block: 'nearest', behavior: 'smooth', inline: 'center' });
      }

      // Update snapshot controls visibility - show if action has any screenshot
      const snapshotControls = document.getElementById('traceSnapshotControls');
      if (snapshotControls) {
        const hasScreenshots = action.beforeScreenshot || action.afterScreenshot || action.screenshot;
        snapshotControls.style.display = hasScreenshots ? 'flex' : 'none';

        // Update button states to show which snapshots are available
        const beforeBtn = snapshotControls.querySelector('[data-snapshot="before"]');
        const afterBtn = snapshotControls.querySelector('[data-snapshot="after"]');
        if (beforeBtn) {
          beforeBtn.disabled = !action.beforeScreenshot;
          beforeBtn.style.opacity = action.beforeScreenshot ? '1' : '0.5';
        }
        if (afterBtn) {
          afterBtn.disabled = !action.afterScreenshot && !action.screenshot;
          afterBtn.style.opacity = (action.afterScreenshot || action.screenshot) ? '1' : '0.5';
        }
      }

      // Update screenshot
      updateScreenshot(action);

      // Update details tab
      updateDetailsTab(action);

      // Update source tab
      updateSourceTab(action);

      // Update logs for this action's timeframe
      updateLogsForAction(action);

      // Update timeline slider position
      updateTimelineSlider(index);

      // Show click position indicator if action has point data
      showClickPosition(action);
    }

    function updateScreenshot(action) {
      const screenshotEl = document.getElementById('traceScreenshot');
      const noScreenshotEl = document.getElementById('traceNoScreenshot');

      // Determine which screenshot to show based on mode
      let screenshot = currentSnapshotMode === 'before' ? action.beforeScreenshot : action.afterScreenshot;
      if (!screenshot) screenshot = action.screenshot;

      // If no screenshot for this action, find the nearest one from other actions
      if (!screenshot || !traceResources[screenshot]) {
        screenshot = findNearestScreenshot(action);
      }

      if (screenshot && traceResources[screenshot]) {
        screenshotEl.src = traceResources[screenshot];
        screenshotEl.style.display = 'block';
        noScreenshotEl.style.display = 'none';

        // Update snapshot visual indicator
        screenshotEl.classList.remove('before-snapshot', 'after-snapshot');
        if (currentSnapshotMode === 'before' && action.beforeScreenshot) {
          screenshotEl.classList.add('before-snapshot');
        } else if (currentSnapshotMode === 'after' && action.afterScreenshot) {
          screenshotEl.classList.add('after-snapshot');
        }
      } else {
        screenshotEl.style.display = 'none';
        noScreenshotEl.style.display = 'flex';
      }
    }

    function findNearestScreenshot(targetAction) {
      if (!traceData || !traceData.actions) return null;

      const targetTime = targetAction.startTime || 0;
      let nearestScreenshot = null;
      let nearestDiff = Infinity;

      // Search through all actions to find the nearest screenshot
      for (const action of traceData.actions) {
        const candidates = [action.screenshot, action.afterScreenshot, action.beforeScreenshot];
        for (const screenshot of candidates) {
          if (screenshot && traceResources[screenshot]) {
            const actionTime = action.startTime || 0;
            const diff = Math.abs(actionTime - targetTime);
            if (diff < nearestDiff) {
              nearestDiff = diff;
              nearestScreenshot = screenshot;
            }
          }
        }
      }

      return nearestScreenshot;
    }

    function switchSnapshot(mode) {
      currentSnapshotMode = mode;

      // Update button states
      document.querySelectorAll('.trace-snapshot-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.snapshot === mode);
      });

      // Update screenshot
      if (traceData && traceData.actions[currentActionIndex]) {
        updateScreenshot(traceData.actions[currentActionIndex]);
      }
    }

    function updateDetailsTab(action) {
      const detailsContent = document.getElementById('traceDetailsContent');
      if (!detailsContent) return;

      let html = \`
        <div class="trace-detail-row">
          <span class="trace-detail-label">Action</span>
          <span class="trace-detail-value">\${escapeHtmlTrace(action.class + '.' + action.method)}</span>
        </div>
        <div class="trace-detail-row">
          <span class="trace-detail-label">Duration</span>
          <span class="trace-detail-value">\${action.duration}ms</span>
        </div>
      \`;

      if (action.params) {
        for (const [key, value] of Object.entries(action.params)) {
          if (value !== null && value !== undefined) {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            html += \`
              <div class="trace-detail-row">
                <span class="trace-detail-label">\${escapeHtmlTrace(key)}</span>
                <span class="trace-detail-value">\${escapeHtmlTrace(displayValue.substring(0, 300))}</span>
              </div>
            \`;
          }
        }
      }

      if (action.result && typeof action.result === 'object') {
        html += \`
          <div class="trace-detail-row">
            <span class="trace-detail-label">Result</span>
            <span class="trace-detail-value">\${escapeHtmlTrace(JSON.stringify(action.result).substring(0, 200))}</span>
          </div>
        \`;
      }

      if (action.error) {
        html += \`
          <div class="trace-detail-row">
            <span class="trace-detail-label">Error</span>
            <span class="trace-detail-value" style="color: var(--accent-red)">\${escapeHtmlTrace(action.error.message)}</span>
          </div>
        \`;
      }

      detailsContent.innerHTML = html;
    }

    function updateSourceTab(action) {
      const sourceContent = document.getElementById('traceSourceContent');
      if (!sourceContent) return;

      if (!action.stack || action.stack.length === 0) {
        sourceContent.innerHTML = '<div class="trace-empty">No source information available</div>';
        return;
      }

      // Find user code frames (not from node_modules)
      const userFrames = action.stack.filter(f =>
        f.file && !f.file.includes('node_modules') && !f.file.includes('internal/')
      );
      const internalFrames = action.stack.filter(f =>
        !f.file || f.file.includes('node_modules') || f.file.includes('internal/')
      );

      let html = '';

      if (userFrames.length > 0) {
        html += \`
          <div class="trace-source-section">
            <div class="trace-source-title">📍 Test Code</div>
            <div class="trace-source-location">
              \${userFrames.map(f => \`
                <div class="trace-stack-frame user-code">
                  at <span class="trace-stack-file">\${escapeHtmlTrace(f.file || 'unknown')}</span>:<span class="trace-stack-line">\${f.line || 0}</span>:\${f.column || 0}
                  \${f.function ? ' (' + escapeHtmlTrace(f.function) + ')' : ''}
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      if (internalFrames.length > 0) {
        html += \`
          <div class="trace-source-section">
            <div class="trace-source-title">📚 Framework Stack</div>
            <div style="max-height: 150px; overflow-y: auto;">
              \${internalFrames.slice(0, 10).map(f => \`
                <div class="trace-stack-frame">
                  at \${escapeHtmlTrace(f.file || 'unknown')}:\${f.line || 0}
                </div>
              \`).join('')}
              \${internalFrames.length > 10 ? '<div class="trace-stack-frame">... ' + (internalFrames.length - 10) + ' more frames</div>' : ''}
            </div>
          </div>
        \`;
      }

      sourceContent.innerHTML = html || '<div class="trace-empty">No source information available</div>';
    }

    function updateLogsForAction(action) {
      const logsContent = document.getElementById('traceLogsContent');
      if (!logsContent || !traceData) return;

      const actionLogs = traceData.logs.filter(log =>
        log.time >= action.startTime && log.time <= action.endTime
      );

      if (actionLogs.length === 0) {
        logsContent.innerHTML = '<div class="trace-empty">No logs for this action</div>';
      } else {
        logsContent.innerHTML = actionLogs.map(log => \`
          <div class="trace-log-item">
            <span class="trace-log-time">\${Math.round(log.time - action.startTime)}ms</span>
            <span class="trace-log-message">\${escapeHtmlTrace(log.message)}</span>
          </div>
        \`).join('');
      }
    }

    function renderConsoleTab() {
      const consoleContent = document.getElementById('traceConsoleContent');
      if (!consoleContent || !traceData) return;

      if (traceData.console.length === 0) {
        consoleContent.innerHTML = '<div class="trace-empty">No console output</div>';
        return;
      }

      const baseTime = traceData.startTime || 0;

      consoleContent.innerHTML = traceData.console.map(entry => {
        const icon = getConsoleIcon(entry.type);
        const relTime = Math.round(entry.timestamp - baseTime);
        return \`
          <div class="trace-console-item \${entry.type}" data-level="\${entry.type}">
            <span class="trace-console-icon">\${icon}</span>
            <span class="trace-console-time">\${relTime}ms</span>
            <span class="trace-console-message">\${escapeHtmlTrace(entry.text)}</span>
            \${entry.location ? \`<span class="trace-console-location">\${escapeHtmlTrace(entry.location)}</span>\` : ''}
          </div>
        \`;
      }).join('');
    }

    function getConsoleIcon(type) {
      const icons = {
        'log': '📝',
        'info': 'ℹ️',
        'warning': '⚠️',
        'warn': '⚠️',
        'error': '❌',
        'debug': '🔍'
      };
      return icons[type] || '📝';
    }

    function filterConsole(level) {
      currentConsoleFilter = level;

      // Update filter buttons
      document.querySelectorAll('.trace-console-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === level);
      });

      // Filter items
      document.querySelectorAll('.trace-console-item').forEach(item => {
        const itemLevel = item.dataset.level;
        let show = level === 'all';
        if (!show) {
          if (level === 'error') show = itemLevel === 'error';
          else if (level === 'warning') show = itemLevel === 'warning' || itemLevel === 'warn';
          else if (level === 'log') show = itemLevel === 'log' || itemLevel === 'info' || itemLevel === 'debug';
        }
        item.classList.toggle('filtered-out', !show);
      });
    }

    function renderNetworkTab() {
      const networkContent = document.getElementById('traceNetworkContent');
      if (!networkContent || !traceData) return;

      const sortedNetwork = getSortedNetworkData();

      if (sortedNetwork.length === 0) {
        networkContent.innerHTML = '<div class="trace-empty">No network requests captured</div>';
        return;
      }

      // Calculate max time for waterfall scaling
      const maxTime = Math.max(...sortedNetwork.map(r => r.time || 0), 1);

      let html = \`
        <div class="trace-network-list">
          <div class="trace-network-header">
            <span class="trace-network-header-cell" data-column="method" onclick="sortNetworkBy('method')">
              Method <span class="trace-network-sort-icon">▼</span>
            </span>
            <span class="trace-network-header-cell" data-column="url" onclick="sortNetworkBy('url')">
              URL <span class="trace-network-sort-icon">▼</span>
            </span>
            <span>Waterfall</span>
            <span class="trace-network-header-cell" data-column="status" onclick="sortNetworkBy('status')">
              Status <span class="trace-network-sort-icon">▼</span>
            </span>
            <span class="trace-network-header-cell" data-column="time" onclick="sortNetworkBy('time')">
              Time <span class="trace-network-sort-icon">▼</span>
            </span>
          </div>
      \`;

      html += sortedNetwork.slice(0, 100).map((req, idx) => {
        const isError = req.status >= 400;
        const isRedirect = req.status >= 300 && req.status < 400;
        const statusClass = isError ? 'error' : (isRedirect ? 'redirect' : 'success');
        const methodClass = req.method.toLowerCase();
        const resourceType = getResourceType(req.url, req.mimeType);

        // Calculate waterfall bars
        const totalTime = req.time || 1;
        const timings = req.timings || {};
        const waterfallHtml = renderWaterfallBars(timings, totalTime, maxTime);

        return \`
          <div class="trace-network-item" data-type="\${resourceType}" data-url="\${escapeHtmlTrace(req.url)}" onclick="toggleNetworkDetails(\${idx})">
            <span class="trace-network-method \${methodClass}">\${req.method}</span>
            <span class="trace-network-url" title="\${escapeHtmlTrace(req.url)}">\${escapeHtmlTrace(getUrlPath(req.url))}</span>
            <div class="trace-network-waterfall">\${waterfallHtml}</div>
            <span class="trace-network-status \${statusClass}">\${req.status}</span>
            <span class="trace-network-time">\${Math.round(req.time || 0)}ms</span>
            <div class="trace-network-details" id="networkDetails\${idx}">
              \${renderNetworkDetails(req)}
            </div>
          </div>
        \`;
      }).join('');

      html += '</div>';

      // Add waterfall legend
      html += \`
        <div class="trace-waterfall-legend">
          <div class="trace-waterfall-legend-item">
            <span class="trace-waterfall-legend-color trace-waterfall-dns"></span> DNS
          </div>
          <div class="trace-waterfall-legend-item">
            <span class="trace-waterfall-legend-color trace-waterfall-connect"></span> Connect
          </div>
          <div class="trace-waterfall-legend-item">
            <span class="trace-waterfall-legend-color trace-waterfall-ssl"></span> SSL
          </div>
          <div class="trace-waterfall-legend-item">
            <span class="trace-waterfall-legend-color trace-waterfall-wait"></span> Wait
          </div>
          <div class="trace-waterfall-legend-item">
            <span class="trace-waterfall-legend-color trace-waterfall-receive"></span> Receive
          </div>
        </div>
      \`;

      networkContent.innerHTML = html;
    }

    function renderWaterfallBars(timings, totalTime, maxTime) {
      if (!timings || totalTime === 0) return '';

      const scale = 180 / maxTime; // 180px max width
      let offset = 0;
      let html = '';

      const phases = [
        { key: 'dns', cls: 'dns' },
        { key: 'connect', cls: 'connect' },
        { key: 'ssl', cls: 'ssl' },
        { key: 'wait', cls: 'wait' },
        { key: 'receive', cls: 'receive' }
      ];

      for (const phase of phases) {
        const duration = timings[phase.key] || 0;
        if (duration > 0) {
          const width = Math.max(2, duration * scale);
          html += \`<div class="trace-waterfall-bar trace-waterfall-\${phase.cls}" style="left: \${offset}px; width: \${width}px;"></div>\`;
          offset += width;
        }
      }

      return html;
    }

    function renderNetworkDetails(req) {
      let html = '';

      // Request Headers
      if (req.requestHeaders && req.requestHeaders.length > 0) {
        html += \`
          <div class="trace-network-details-section" onclick="event.stopPropagation(); toggleDetailsSection(this)">
            <div class="trace-network-details-title">Request Headers (\${req.requestHeaders.length})</div>
            <div class="trace-network-details-content">
              \${req.requestHeaders.map(h => \`
                <div class="trace-header-row">
                  <span class="trace-header-name">\${escapeHtmlTrace(h.name)}</span>
                  <span class="trace-header-value">\${escapeHtmlTrace(h.value)}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      // Response Headers
      if (req.responseHeaders && req.responseHeaders.length > 0) {
        html += \`
          <div class="trace-network-details-section" onclick="event.stopPropagation(); toggleDetailsSection(this)">
            <div class="trace-network-details-title">Response Headers (\${req.responseHeaders.length})</div>
            <div class="trace-network-details-content">
              \${req.responseHeaders.map(h => \`
                <div class="trace-header-row">
                  <span class="trace-header-name">\${escapeHtmlTrace(h.name)}</span>
                  <span class="trace-header-value">\${escapeHtmlTrace(h.value)}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      // Request Body
      if (req.requestBody) {
        html += \`
          <div class="trace-network-details-section" onclick="event.stopPropagation(); toggleDetailsSection(this)">
            <div class="trace-network-details-title">Request Body</div>
            <div class="trace-network-details-content">
              <pre class="trace-request-body">\${escapeHtmlTrace(formatBody(req.requestBody))}</pre>
            </div>
          </div>
        \`;
      }

      // Timing breakdown
      if (req.timings) {
        const t = req.timings;
        html += \`
          <div class="trace-network-details-section expanded" onclick="event.stopPropagation(); toggleDetailsSection(this)">
            <div class="trace-network-details-title">Timing</div>
            <div class="trace-network-details-content">
              <div class="trace-header-row"><span class="trace-header-name">DNS</span><span class="trace-header-value">\${t.dns.toFixed(1)}ms</span></div>
              <div class="trace-header-row"><span class="trace-header-name">Connect</span><span class="trace-header-value">\${t.connect.toFixed(1)}ms</span></div>
              <div class="trace-header-row"><span class="trace-header-name">SSL</span><span class="trace-header-value">\${t.ssl.toFixed(1)}ms</span></div>
              <div class="trace-header-row"><span class="trace-header-name">Wait (TTFB)</span><span class="trace-header-value">\${t.wait.toFixed(1)}ms</span></div>
              <div class="trace-header-row"><span class="trace-header-name">Receive</span><span class="trace-header-value">\${t.receive.toFixed(1)}ms</span></div>
            </div>
          </div>
        \`;
      }

      return html;
    }

    function toggleNetworkDetails(idx) {
      const item = document.querySelectorAll('.trace-network-item')[idx];
      if (item) {
        item.classList.toggle('expanded');
      }
    }

    function toggleDetailsSection(section) {
      section.classList.toggle('expanded');
    }

    function formatBody(body) {
      if (!body) return '';
      try {
        const parsed = JSON.parse(body);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return body;
      }
    }

    function getResourceType(url, mimeType) {
      if (mimeType) {
        if (mimeType.includes('javascript')) return 'js';
        if (mimeType.includes('css')) return 'css';
        if (mimeType.includes('image')) return 'img';
        if (mimeType.includes('html')) return 'doc';
        if (mimeType.includes('json') || mimeType.includes('xml')) return 'xhr';
      }
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
      if (['js', 'mjs'].includes(ext)) return 'js';
      if (['css'].includes(ext)) return 'css';
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) return 'img';
      if (['html', 'htm'].includes(ext)) return 'doc';
      return 'xhr';
    }

    function getUrlPath(url) {
      try {
        const u = new URL(url);
        return u.pathname + u.search;
      } catch {
        return url;
      }
    }

    function filterNetwork(searchTerm) {
      currentNetworkFilter = searchTerm.toLowerCase();
      applyNetworkFilters();
    }

    function filterNetworkType(type) {
      currentNetworkType = type;

      // Update filter buttons
      document.querySelectorAll('.trace-network-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
      });

      applyNetworkFilters();
    }

    function applyNetworkFilters() {
      document.querySelectorAll('.trace-network-item').forEach(item => {
        const url = (item.dataset.url || '').toLowerCase();
        const type = item.dataset.type || 'xhr';

        const matchesSearch = !currentNetworkFilter || url.includes(currentNetworkFilter);
        const matchesType = currentNetworkType === 'all' || type === currentNetworkType;

        item.classList.toggle('filtered-out', !matchesSearch || !matchesType);
      });
    }

    function renderMetadataTab() {
      const metadataContent = document.getElementById('traceMetadataContent');
      if (!metadataContent || !traceData) return;

      const m = traceData.metadata;
      const ctx = traceData.contextInfo || {};

      metadataContent.innerHTML = \`
        <div class="trace-metadata-grid">
          <div class="trace-metadata-card">
            <div class="trace-metadata-card-title">🌐 Browser</div>
            <div class="trace-metadata-row">
              <span class="trace-metadata-label">Name</span>
              <span class="trace-metadata-value">\${escapeHtmlTrace(m.browserName)}</span>
            </div>
            \${m.browserVersion ? \`
              <div class="trace-metadata-row">
                <span class="trace-metadata-label">Version</span>
                <span class="trace-metadata-value">\${escapeHtmlTrace(m.browserVersion)}</span>
              </div>
            \` : ''}
            \${ctx.channel ? \`
              <div class="trace-metadata-row">
                <span class="trace-metadata-label">Channel</span>
                <span class="trace-metadata-value">\${escapeHtmlTrace(ctx.channel)}</span>
              </div>
            \` : ''}
          </div>

          <div class="trace-metadata-card">
            <div class="trace-metadata-card-title">📐 Viewport</div>
            <div class="trace-metadata-row">
              <span class="trace-metadata-label">Width</span>
              <span class="trace-metadata-value">\${m.viewport.width || 'auto'}px</span>
            </div>
            <div class="trace-metadata-row">
              <span class="trace-metadata-label">Height</span>
              <span class="trace-metadata-value">\${m.viewport.height || 'auto'}px</span>
            </div>
            \${ctx.deviceScaleFactor ? \`
              <div class="trace-metadata-row">
                <span class="trace-metadata-label">Scale</span>
                <span class="trace-metadata-value">\${ctx.deviceScaleFactor}x</span>
              </div>
            \` : ''}
          </div>

          <div class="trace-metadata-card">
            <div class="trace-metadata-card-title">💻 Platform</div>
            <div class="trace-metadata-row">
              <span class="trace-metadata-label">OS</span>
              <span class="trace-metadata-value">\${escapeHtmlTrace(m.platform)}</span>
            </div>
            \${m.locale ? \`
              <div class="trace-metadata-row">
                <span class="trace-metadata-label">Locale</span>
                <span class="trace-metadata-value">\${escapeHtmlTrace(m.locale)}</span>
              </div>
            \` : ''}
            \${ctx.timezoneId ? \`
              <div class="trace-metadata-row">
                <span class="trace-metadata-label">Timezone</span>
                <span class="trace-metadata-value">\${escapeHtmlTrace(ctx.timezoneId)}</span>
              </div>
            \` : ''}
          </div>

          <div class="trace-metadata-card">
            <div class="trace-metadata-card-title">⏱️ Timing</div>
            <div class="trace-metadata-row">
              <span class="trace-metadata-label">Duration</span>
              <span class="trace-metadata-value">\${(m.duration / 1000).toFixed(2)}s</span>
            </div>
            <div class="trace-metadata-row">
              <span class="trace-metadata-label">Actions</span>
              <span class="trace-metadata-value">\${traceData.actions.length}</span>
            </div>
            <div class="trace-metadata-row">
              <span class="trace-metadata-label">Network</span>
              <span class="trace-metadata-value">\${traceData.network.length} requests</span>
            </div>
          </div>
        </div>
      \`;
    }

    function renderErrorsTab() {
      const errorsContent = document.getElementById('traceErrorsContent');
      if (!errorsContent || !traceData) return;

      if (traceData.errors.length === 0) {
        errorsContent.innerHTML = '<div class="trace-empty">No errors</div>';
      } else {
        errorsContent.innerHTML = traceData.errors.map(err => \`
          <div class="trace-error-item">
            <div class="trace-error-action">Action: \${escapeHtmlTrace(err.action)}</div>
            <div class="trace-error-name">\${escapeHtmlTrace(err.name)}</div>
            <div class="trace-error-message">\${escapeHtmlTrace(err.message)}</div>
          </div>
        \`).join('');
      }
    }

    function updateTabBadges() {
      // Console badge
      const consoleBadge = document.getElementById('traceConsoleCount');
      if (consoleBadge && traceData) {
        const errorCount = traceData.console.filter(c => c.type === 'error').length;
        if (errorCount > 0) {
          consoleBadge.textContent = errorCount;
          consoleBadge.style.display = 'inline-block';
        } else {
          consoleBadge.style.display = 'none';
        }
      }

      // Error badge
      const errorBadge = document.getElementById('traceErrorCount');
      if (errorBadge && traceData) {
        if (traceData.errors.length > 0) {
          errorBadge.textContent = traceData.errors.length;
          errorBadge.style.display = 'inline-block';
        } else {
          errorBadge.style.display = 'none';
        }
      }
    }

    function filterTraceActions(searchTerm) {
      actionSearchTerm = searchTerm.toLowerCase();

      // Show/hide clear button
      const clearBtn = document.getElementById('traceSearchClear');
      if (clearBtn) {
        clearBtn.style.display = searchTerm ? 'block' : 'none';
      }

      // Filter and highlight actions
      document.querySelectorAll('.trace-action-item').forEach(item => {
        const index = parseInt(item.dataset.index);
        const action = traceData?.actions[index];
        if (!action) return;

        const title = (action.title || action.method || '').toLowerCase();
        const selector = (action.params?.selector || action.params?.url || '').toLowerCase();
        const matches = !searchTerm || title.includes(actionSearchTerm) || selector.includes(actionSearchTerm);

        item.classList.toggle('filtered-out', !matches);

        // Highlight matching text
        const nameEl = item.querySelector('.trace-action-name');
        if (nameEl && action) {
          const originalText = action.title || action.method;
          if (searchTerm && matches) {
            const regex = new RegExp('(' + escapeRegex(searchTerm) + ')', 'gi');
            nameEl.innerHTML = escapeHtmlTrace(originalText).replace(regex, '<mark>$1</mark>');
          } else {
            nameEl.textContent = originalText;
          }
        }
      });
    }

    function clearActionSearch() {
      const input = document.getElementById('traceActionSearch');
      if (input) {
        input.value = '';
        filterTraceActions('');
      }
    }

    function escapeRegex(str) {
      return str.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    }

    function setupPanelResizer() {
      const resizer = document.getElementById('traceResizer');
      const actionsPanel = document.getElementById('traceActionsPanel');
      if (!resizer || !actionsPanel) return;

      let isResizing = false;
      let startX = 0;
      let startWidth = 0;

      resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = actionsPanel.offsetWidth;
        resizer.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      });

      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const diff = e.clientX - startX;
        const newWidth = Math.min(Math.max(startWidth + diff, 200), 400);
        actionsPanel.style.width = newWidth + 'px';
      });

      document.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          resizer.classList.remove('active');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }

    function getActionIcon(method) {
      const icons = {
        'goto': '🌐',
        'click': '👆',
        'dblclick': '👆',
        'fill': '⌨️',
        'type': '⌨️',
        'press': '⌨️',
        'check': '☑️',
        'uncheck': '☐',
        'selectOption': '📋',
        'hover': '🖱️',
        'focus': '🎯',
        'blur': '💨',
        'screenshot': '📸',
        'evaluate': '⚙️',
        'evaluateHandle': '⚙️',
        'waitForSelector': '⏳',
        'waitForTimeout': '⏱️',
        'waitForLoadState': '⏳',
        'waitForNavigation': '⏳',
        'waitForURL': '⏳',
        'waitForFunction': '⏳',
        'expect': '✓',
        'toBeVisible': '👁️',
        'toHaveText': '📝',
        'toHaveValue': '📝',
        'toBeChecked': '☑️',
        'toBeEnabled': '✓',
        'toBeDisabled': '⛔',
        'toHaveAttribute': '🏷️',
        'toHaveClass': '🎨',
        'toHaveCount': '#️⃣',
        'toContainText': '📝',
        'newPage': '📄',
        'newContext': '🆕',
        'close': '❌',
        'setContent': '📄',
        'setViewportSize': '📐',
        'route': '🛣️',
        'unroute': '🛣️',
        'request': '📡',
        'fetch': '📡'
      };
      return icons[method] || '▶️';
    }

    function switchTraceTab(tabName) {
      document.querySelectorAll('.trace-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });
      document.querySelectorAll('.trace-tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === 'traceTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
      });
    }

    function showTraceState(state) {
      const loading = document.getElementById('traceLoading');
      const error = document.getElementById('traceError');
      const content = document.getElementById('traceContent');

      if (loading) loading.style.display = state === 'loading' ? 'flex' : 'none';
      if (error) error.style.display = state === 'error' ? 'flex' : 'none';
      if (content) content.style.display = state === 'content' ? 'flex' : 'none';
    }

    function showTraceError(message) {
      showTraceState('error');
      const msgEl = document.getElementById('traceErrorMessage');
      if (msgEl) msgEl.textContent = message;
    }

    function closeTraceModal() {
      const modal = document.getElementById('traceViewerModal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('fullscreen');
        document.body.style.overflow = '';
      }
      traceData = null;
      traceResources = {};
      traceScreenshots = new Map();
      currentActionIndex = 0;
      currentSnapshotMode = 'after';
      actionSearchTerm = '';
    }

    function toggleFullscreen() {
      const modal = document.getElementById('traceViewerModal');
      const icon = document.getElementById('fullscreenIcon');
      if (modal) {
        modal.classList.toggle('fullscreen');
        if (icon) {
          icon.textContent = modal.classList.contains('fullscreen') ? '⛶' : '⛶';
        }
      }
    }

    function escapeHtmlTrace(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Timeline slider functionality
    function setupTimelineSlider() {
      const track = document.getElementById('traceSliderTrack');
      const thumb = document.getElementById('traceSliderThumb');
      const progress = document.getElementById('traceSliderProgress');
      if (!track || !thumb || !progress || !traceData) return;

      let isDragging = false;

      function updateSliderPosition(percent) {
        const clampedPercent = Math.max(0, Math.min(100, percent));
        thumb.style.left = clampedPercent + '%';
        progress.style.width = clampedPercent + '%';

        // Find closest action to this time position
        if (traceData.actions.length > 0) {
          const actionIndex = Math.round((clampedPercent / 100) * (traceData.actions.length - 1));
          selectTraceAction(actionIndex);
        }
      }

      function handleSliderInteraction(e) {
        const rect = track.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        updateSliderPosition(percent);
      }

      track.addEventListener('click', handleSliderInteraction);

      thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        handleSliderInteraction(e);
      });

      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    }

    function updateTimelineSlider(actionIndex) {
      const thumb = document.getElementById('traceSliderThumb');
      const progress = document.getElementById('traceSliderProgress');
      if (!thumb || !progress || !traceData || traceData.actions.length === 0) return;

      const percent = (actionIndex / (traceData.actions.length - 1)) * 100;
      thumb.style.left = percent + '%';
      progress.style.width = percent + '%';
    }

    // Timeline hover magnification
    function setupTimelineMagnifier() {
      const scroll = document.getElementById('traceTimelineScroll');
      const magnifier = document.getElementById('traceTimelineMagnifier');
      const magnifierImg = document.getElementById('traceMagnifierImg');
      const magnifierTime = document.getElementById('traceMagnifierTime');
      if (!scroll || !magnifier) return;

      scroll.addEventListener('mousemove', (e) => {
        const thumb = e.target.closest('.trace-timeline-thumb');
        if (!thumb) {
          magnifier.style.display = 'none';
          return;
        }

        const img = thumb.querySelector('img');
        if (!img || !img.src) {
          magnifier.style.display = 'none';
          return;
        }

        magnifierImg.src = img.src;
        const timestamp = parseInt(thumb.dataset.timestamp) || 0;
        const baseTime = traceData?.startTime || 0;
        magnifierTime.textContent = Math.round(timestamp - baseTime) + 'ms';

        // Position magnifier
        const thumbRect = thumb.getBoundingClientRect();
        const scrollRect = scroll.getBoundingClientRect();
        magnifier.style.left = (thumbRect.left - scrollRect.left + thumbRect.width / 2) + 'px';
        magnifier.style.display = 'block';
      });

      scroll.addEventListener('mouseleave', () => {
        magnifier.style.display = 'none';
      });
    }

    // Click position indicator
    function showClickPosition(action) {
      const indicator = document.getElementById('traceClickIndicator');
      const container = document.getElementById('traceScreenshotContainer');
      const screenshot = document.getElementById('traceScreenshot');

      if (!indicator || !container || !screenshot) return;

      // Check if this is a click action with point data
      const isClickAction = ['click', 'dblclick', 'hover', 'tap'].includes(action.method);
      const hasPoint = action.point && typeof action.point.x === 'number' && typeof action.point.y === 'number';

      if (!isClickAction || !hasPoint) {
        indicator.style.display = 'none';
        return;
      }

      // Wait for image to load to get correct dimensions
      if (!screenshot.complete || screenshot.naturalWidth === 0) {
        screenshot.onload = () => showClickPosition(action);
        return;
      }

      // Calculate position relative to displayed image
      const imgRect = screenshot.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Scale factor between original viewport and displayed image
      const scaleX = imgRect.width / (traceData?.metadata?.viewport?.width || 1280);
      const scaleY = imgRect.height / (traceData?.metadata?.viewport?.height || 720);

      const x = (imgRect.left - containerRect.left) + (action.point.x * scaleX);
      const y = (imgRect.top - containerRect.top) + (action.point.y * scaleY);

      indicator.style.left = x + 'px';
      indicator.style.top = y + 'px';
      indicator.style.display = 'block';
    }

    // Attachments tab
    function renderAttachmentsTab() {
      const content = document.getElementById('traceAttachmentsContent');
      if (!content || !traceData) return;

      // Collect all resources that look like attachments (store globally for preview)
      traceAttachments = [];

      // Add screenshots as attachments
      for (const [key, dataUri] of Object.entries(traceResources)) {
        if (key.endsWith('.jpeg') || key.endsWith('.png')) {
          traceAttachments.push({
            name: key,
            type: 'image',
            dataUri: dataUri
          });
        }
      }

      if (traceAttachments.length === 0) {
        content.innerHTML = '<div class="trace-empty">No attachments in this trace</div>';
        return;
      }

      content.innerHTML = \`
        <div class="trace-attachments-grid">
          \${traceAttachments.slice(0, 20).map((att, idx) => \`
            <div class="trace-attachment-card">
              <div class="trace-attachment-preview">
                \${att.type === 'image' ? \`<img src="\${att.dataUri}" alt="\${escapeHtmlTrace(att.name)}" onclick="openAttachmentPreview(\${idx})">\` : \`<span class="trace-attachment-preview-icon">📎</span>\`}
              </div>
              <div class="trace-attachment-info">
                <div class="trace-attachment-name" title="\${escapeHtmlTrace(att.name)}">\${escapeHtmlTrace(att.name)}</div>
                <div class="trace-attachment-meta">\${att.type}</div>
              </div>
            </div>
          \`).join('')}
        </div>
        \${traceAttachments.length > 20 ? '<p class="trace-empty">Showing first 20 of ' + traceAttachments.length + ' attachments</p>' : ''}
      \`;

      // Update badge
      const badge = document.getElementById('traceAttachmentCount');
      if (badge && traceAttachments.length > 0) {
        badge.textContent = traceAttachments.length;
        badge.style.display = 'inline-block';
      }
    }

    // Open attachment in fullscreen preview modal
    function openAttachmentPreview(index) {
      if (!traceAttachments[index]) return;

      const att = traceAttachments[index];

      // Create or reuse modal
      let modal = document.getElementById('attachmentPreviewModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'attachmentPreviewModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
        document.body.appendChild(modal);
      }

      modal.innerHTML = \`
        <div style="color:#fff;margin-bottom:10px;font-size:14px;">\${escapeHtmlTrace(att.name)} (\${index + 1}/\${traceAttachments.length})</div>
        <img src="\${att.dataUri}" style="max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px;" alt="\${escapeHtmlTrace(att.name)}">
        <div style="margin-top:15px;display:flex;gap:10px;">
          <button onclick="openAttachmentPreview(\${Math.max(0, index - 1)})" style="padding:8px 16px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;" \${index === 0 ? 'disabled style="opacity:0.5;padding:8px 16px;background:#333;color:#fff;border:none;border-radius:4px;"' : ''}>← Previous</button>
          <button onclick="document.getElementById('attachmentPreviewModal').style.display='none'" style="padding:8px 16px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;">Close (Esc)</button>
          <button onclick="openAttachmentPreview(\${Math.min(traceAttachments.length - 1, index + 1)})" style="padding:8px 16px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;" \${index === traceAttachments.length - 1 ? 'disabled style="opacity:0.5;padding:8px 16px;background:#333;color:#fff;border:none;border-radius:4px;"' : ''}>Next →</button>
        </div>
      \`;
      modal.style.display = 'flex';

      // Add keyboard navigation
      const keyHandler = (e) => {
        if (modal.style.display !== 'flex') {
          document.removeEventListener('keydown', keyHandler);
          return;
        }
        if (e.key === 'Escape') modal.style.display = 'none';
        if (e.key === 'ArrowLeft' && index > 0) openAttachmentPreview(index - 1);
        if (e.key === 'ArrowRight' && index < traceAttachments.length - 1) openAttachmentPreview(index + 1);
      };
      document.addEventListener('keydown', keyHandler);
    }

    // Sortable network columns
    let networkSortColumn = null;
    let networkSortAsc = true;

    function sortNetworkBy(column) {
      if (networkSortColumn === column) {
        networkSortAsc = !networkSortAsc;
      } else {
        networkSortColumn = column;
        networkSortAsc = true;
      }

      // Update header styles
      document.querySelectorAll('.trace-network-header-cell').forEach(cell => {
        const isActive = cell.dataset.column === column;
        cell.classList.toggle('sorted', isActive);
        const icon = cell.querySelector('.trace-network-sort-icon');
        if (icon) {
          icon.textContent = isActive ? (networkSortAsc ? '▲' : '▼') : '▼';
        }
      });

      // Re-render with current sort settings (sorting done in renderNetworkTab)
      if (traceData && traceData.network) {
        renderNetworkTab();
      }
    }

    // Get sorted network data without mutating original
    function getSortedNetworkData() {
      if (!traceData || !traceData.network) return [];

      // Create a shallow copy to avoid mutating original order
      const networkCopy = [...traceData.network];

      if (!networkSortColumn) return networkCopy;

      return networkCopy.sort((a, b) => {
        let aVal, bVal;
        switch (networkSortColumn) {
          case 'method': aVal = a.method || ''; bVal = b.method || ''; break;
          case 'url': aVal = a.url || ''; bVal = b.url || ''; break;
          case 'status': aVal = a.status || 0; bVal = b.status || 0; break;
          case 'time': aVal = a.time || 0; bVal = b.time || 0; break;
          default: return 0;
        }
        if (typeof aVal === 'string') {
          return networkSortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return networkSortAsc ? aVal - bVal : bVal - aVal;
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('traceViewerModal');
      if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') closeTraceModal();
        if (e.key === 'ArrowUp' && traceData) {
          e.preventDefault();
          // Find previous visible action
          let prev = currentActionIndex - 1;
          while (prev >= 0) {
            const item = document.querySelector(\`.trace-action-item[data-index="\${prev}"]\`);
            if (item && !item.classList.contains('filtered-out')) break;
            prev--;
          }
          if (prev >= 0) selectTraceAction(prev);
        }
        if (e.key === 'ArrowDown' && traceData) {
          e.preventDefault();
          // Find next visible action
          let next = currentActionIndex + 1;
          while (next < traceData.actions.length) {
            const item = document.querySelector(\`.trace-action-item[data-index="\${next}"]\`);
            if (item && !item.classList.contains('filtered-out')) break;
            next++;
          }
          if (next < traceData.actions.length) selectTraceAction(next);
        }
        // Before/After snapshot shortcuts
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          switchSnapshot('before');
        }
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          switchSnapshot('after');
        }
        // Tab switching with number keys
        if (e.key === '1') switchTraceTab('details');
        if (e.key === '2') switchTraceTab('console');
        if (e.key === '3') switchTraceTab('source');
        if (e.key === '4') switchTraceTab('network');
        if (e.key === '5') switchTraceTab('metadata');
        if (e.key === '6') switchTraceTab('errors');
        // Fullscreen toggle
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    });
  `;
}
