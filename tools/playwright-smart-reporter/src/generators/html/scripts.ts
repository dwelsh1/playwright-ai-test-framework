import { generateGalleryScript } from '../gallery-generator';
import { generateComparisonScript } from '../comparison-generator';

/**
 * Generate all JavaScript for the new app-shell layout
 */
export function generateScripts(
  testsJson: string,
  includeGallery: boolean,
  includeComparison: boolean,
  enableTraceViewer: boolean,
  enableHistoryDrilldown: boolean,
  historyRunSnapshotsJson: string,
  statsData: string,
  reporterOptionsJson: string,
): string {
  return `    const tests = ${testsJson};
    const stats = ${statsData};
    const reporterOptions = ${reporterOptionsJson};
    const traceViewerEnabled = ${enableTraceViewer ? 'true' : 'false'};
    const historyDrilldownEnabled = ${enableHistoryDrilldown ? 'true' : 'false'};
    const historyRunSnapshots = ${historyRunSnapshotsJson};
    const detailsBodyCache = new WeakMap();
    let currentView = 'overview';
    let selectedTestId = null;
    let currentTestTab = 'all';

    /* ============================================
       APP SHELL NAVIGATION
    ============================================ */

    function toggleSidebar() {
      const appShell = document.querySelector('.app-shell');
      const toggleBtn = document.querySelector('.sidebar-toggle');

      // Same collapse behavior for all screen sizes
      appShell.classList.toggle('sidebar-collapsed');
      const isExpanded = !appShell.classList.contains('sidebar-collapsed');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }

    function switchView(view) {
      // Update nav items and ARIA states
      document.querySelectorAll('.nav-item').forEach(item => {
        const isActive = item.dataset.view === view;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Hide all view panels
      document.querySelectorAll('.view-panel').forEach(panel => {
        panel.style.display = 'none';
      });

      // Show selected view
      const viewPanel = document.getElementById('view-' + view);
      if (viewPanel) {
        viewPanel.style.display = 'block';
      }

      // Update breadcrumb
      const breadcrumbDetail = document.getElementById('breadcrumb-detail');
      if (breadcrumbDetail) {
        breadcrumbDetail.textContent = view.charAt(0).toUpperCase() + view.slice(1);
      }

      currentView = view;

      // Phase 5: populate comparison quick-selectors when switching to comparison view
      if (view === 'comparison') { renderComparisonQuickSelectors(); }

      // Re-apply trend bar filtering when switching to the trends view.
      if (view === 'trends') { filterTrendBars(); }
    }

    // Track global historical run selection
    let globalHistoricalRunId = null;
    let globalHistoricalRunLabel = '';

    function loadHistoricalRun(runId, label) {
      if (!historyDrilldownEnabled) {
        alert('History drilldown is not enabled. Set enableHistoryDrilldown: true in reporter options.');
        return;
      }

      const runData = historyRunSnapshots[runId];
      if (!runData || !runData.tests) {
        alert('No snapshot data available for this run. Historical snapshots may not have been saved for this run.');
        return;
      }

      // Set global historical run
      globalHistoricalRunId = runId;
      globalHistoricalRunLabel = label;

      // Show history banner
      showGlobalHistoryBanner(label);

      // Switch to tests view
      switchView('tests');
      switchTestTab('all');

      // Auto-select the first test to show historical data
      const firstTestItem = document.querySelector('.test-list-item');
      if (firstTestItem) {
        const testId = firstTestItem.id.replace('list-item-', '');
        selectTest(testId);
      }
    }

    function showGlobalHistoryBanner(label) {
      const viewHeader = document.querySelector('#view-tests .view-header');
      if (viewHeader) {
        let historyBanner = viewHeader.querySelector('.history-banner');
        if (!historyBanner) {
          historyBanner = document.createElement('div');
          historyBanner.className = 'history-banner';
          viewHeader.appendChild(historyBanner);
        }
        historyBanner.innerHTML = \`
          <span class="history-banner-icon">📅</span>
          <span class="history-banner-text">Viewing run: <strong>\${label}</strong> — Each test shows this run's data. Use per-test history dots to compare.</span>
          <button class="history-banner-close" onclick="exitGlobalHistoricalView()">Back to Current Run</button>
        \`;
        historyBanner.style.display = 'flex';
      }
    }

    function exitGlobalHistoricalView() {
      globalHistoricalRunId = null;
      globalHistoricalRunLabel = '';

      // Hide history banner
      const historyBanner = document.querySelector('.history-banner');
      if (historyBanner) {
        historyBanner.style.display = 'none';
      }

      // Reset all test cards to current state
      document.querySelectorAll('.test-card').forEach(card => {
        const testIdEl = card.querySelector('.history-dot[data-testid]');
        const testId = testIdEl ? testIdEl.getAttribute('data-testid') : null;
        if (testId) {
          resetCardToCurrentState(card, testId);
        }
      });

      // Re-select current test to refresh detail panel
      if (selectedTestId) {
        selectTest(selectedTestId);
      }
    }

    function resetCardToCurrentState(card, testId) {
      const details = card.querySelector('.test-details');
      const body = details ? details.querySelector('[data-details-body]') : null;
      if (body) {
        const original = detailsBodyCache.get(body);
        if (typeof original === 'string') {
          body.innerHTML = original;
        }
      }
      clearSelectedDots(card);
      clearSelectedDurationBars(card);
      showBackButton(card, false);
      restoreTrendUI(card, testId);
    }

    function applyHistoricalRunToCard(card, testId, runId) {
      const runData = getRunSnapshot(runId);
      const snapshot = runData && runData.tests ? runData.tests[testId] : null;
      
      if (!snapshot) {
        // No data for this test in this run - might be a new test
        return false;
      }

      const details = card.querySelector('.test-details');
      const body = details ? details.querySelector('[data-details-body]') : null;
      if (!body) return false;

      // Cache original content
      if (!detailsBodyCache.has(body)) {
        detailsBodyCache.set(body, body.innerHTML);
      }

      // Find and select the appropriate history dot
      const dots = card.querySelectorAll('.history-dot[data-runid]');
      let matchingDot = null;
      dots.forEach(d => {
        if (d.getAttribute('data-runid') === runId) {
          matchingDot = d;
        }
      });

      clearSelectedDots(card);
      clearSelectedDurationBars(card);
      if (matchingDot) {
        matchingDot.classList.add('selected');
      }

      // Render snapshot body
      const testModel = getTestModel(testId);
      const avg = testModel ? computeAvgDurationFromHistory(testModel) : 0;
      body.innerHTML = renderSnapshotBody(snapshot, avg);

      // Update trend UI
      updateTrendUI(card, testId, runId, snapshot.duration);
      showBackButton(card, true);

      return true;
    }

    function switchTestTab(tab) {
      // Update tab buttons and ARIA states
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Hide all tab content
      document.querySelectorAll('.test-tab-content').forEach(content => {
        content.classList.remove('active');
      });

      // Show selected tab
      const tabContent = document.getElementById('tab-' + tab);
      if (tabContent) {
        tabContent.classList.add('active');
      }

      currentTestTab = tab;
    }

    function selectTest(testId) {
      // Update selection in list
      document.querySelectorAll('.test-list-item').forEach(item => {
        item.classList.toggle('selected', item.id === 'list-item-' + testId);
      });

      // Find test data - use same sanitization as TypeScript sanitizeId()
      const test = tests.find(t => {
        const id = String(t.testId || '').replace(/[^a-zA-Z0-9]/g, '_');
        return id === testId;
      });

      if (!test) {
        return;
      }

      selectedTestId = testId;

      // Get the pre-rendered card from hidden container - use getElementById for reliability
      const cardId = 'card-' + testId;
      const cardHtml = document.getElementById(cardId);
      const detailPanel = document.getElementById('test-detail-panel');

      if (cardHtml && detailPanel) {
        // Clone and display the card
        const clone = cardHtml.cloneNode(true);
        clone.classList.add('expanded');
        clone.style.display = 'block';

        // Make sure test-details is visible
        const details = clone.querySelector('.test-details');
        if (details) {
          details.style.display = 'block';
        }

        // Remove expand icon and onclick since card is always expanded in detail panel
        const expandIcon = clone.querySelector('.expand-icon');
        if (expandIcon) expandIcon.remove();
        const header = clone.querySelector('.test-card-header');
        if (header) header.removeAttribute('onclick');

        detailPanel.innerHTML = '';
        detailPanel.appendChild(clone);

        // If global historical run is set, apply it to this card
        // Use test.testId (original) not testId (sanitized) for snapshot lookup
        if (globalHistoricalRunId) {
          applyHistoricalRunToCard(clone, test.testId, globalHistoricalRunId);
        }

        // Update breadcrumb
        const breadcrumbDetail = document.getElementById('breadcrumb-detail');
        if (breadcrumbDetail) {
          breadcrumbDetail.textContent = test.title;
        }
      } else {
        // Fallback: render basic details if card not found
        const detailPanel = document.getElementById('test-detail-panel');
        if (detailPanel) {
          const statusClass = test.status === 'passed' ? 'passed' : test.status === 'skipped' ? 'skipped' : 'failed';
          detailPanel.innerHTML = \`
            <div class="detail-view-content">
              <div class="detail-view-header">
                <div class="detail-status-indicator \${statusClass}"></div>
                <div class="detail-info">
                  <h2 class="detail-title">\${escapeHtmlUnsafe(test.title)}</h2>
                  <div class="detail-file">\${escapeHtmlUnsafe(test.file)}</div>
                </div>
                <div class="detail-duration">\${formatDurationMs(test.duration)}</div>
              </div>
              \${test.error ? \`
                <div class="detail-section">
                  <div class="detail-label"><span class="icon">⚠</span> Error</div>
                  <div class="error-box">\${escapeHtmlUnsafe(test.error)}</div>
                </div>
              \` : ''}
              \${test.steps && test.steps.length > 0 ? \`
                <div class="detail-section">
                  <div class="detail-label"><span class="icon">⏱</span> Steps (\${test.steps.length})</div>
                  <div class="steps-container">
                    \${test.steps.map(step => \`
                      <div class="step-row \${step.isSlowest ? 'slowest' : ''}">
                        <span class="step-title">\${escapeHtmlUnsafe(step.title)}</span>
                        <span class="step-duration">\${formatDurationMs(step.duration)}</span>
                      </div>
                    \`).join('')}
                  </div>
                </div>
              \` : ''}
              \${test.aiSuggestion ? \`
                <div class="detail-section">
                  <div class="detail-label"><span class="icon">🤖</span> AI Suggestion</div>
                  <div class="ai-box">\${escapeHtmlUnsafe(test.aiSuggestion)}</div>
                </div>
              \` : ''}
            </div>
          \`;
        }
      }
    }

    function filterByFile(file) {
      // Clear filter chip visual state AND activeFilters state so they stay in sync
      Object.values(activeFilters).forEach(s => s.clear());
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      });
      updateFilterGroupBadge('context-project');
      updateFilterGroupBadge('context-build');

      // Switch to tests view
      switchView('tests');

      // Filter test list items and cards by file
      document.querySelectorAll('.test-list-item, .test-card').forEach(item => {
        const matches = item.dataset.file === file;
        item.style.display = matches ? (item.classList.contains('test-card') ? 'block' : 'flex') : 'none';
      });

      // Update file group visibility
      document.querySelectorAll('.file-group').forEach(group => {
        const hasVisible = Array.from(group.querySelectorAll('.test-list-item, .test-card')).some(
          el => el.style.display !== 'none'
        );
        group.style.display = hasVisible ? 'block' : 'none';
      });

      // Update active file in tree
      document.querySelectorAll('.file-tree-item').forEach(item => {
        item.classList.toggle('active', item.dataset.file === file);
      });

      checkEmptyState();
    }

    function filterByStatus(status) {
      // Switch to tests view first
      switchView('tests');

      // Clear all filters and activate the matching status filter
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      });

      // Find and activate the matching status filter chip
      const statusChip = document.querySelector('.filter-chip[data-filter="' + status + '"]');
      if (statusChip) {
        statusChip.classList.add('active');
        statusChip.setAttribute('aria-pressed', 'true');
      }

      // Apply filter to test cards and list items
      applyFilters();
    }

    /* ============================================
       SEARCH FUNCTIONALITY
    ============================================ */

    function openSearch() {
      const modal = document.getElementById('search-modal');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.getElementById('search-modal-input').focus();
    }

    function closeSearch() {
      const modal = document.getElementById('search-modal');
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.getElementById('search-modal-input').value = '';
      document.getElementById('search-modal-results').innerHTML = '';
    }

    function selectSearchResult(testId) {
      closeSearch();
      switchView('tests');
      // Reset any stale file-filter display overrides so the test list is fully visible
      clearAllFilters();
      selectTest(testId);
    }

    /* ============================================
       FILTER FUNCTIONALITY (updated for new layout)
    ============================================ */

    function searchTests(query) {
      const lowerQuery = query.toLowerCase();

      // Filter test list items
      document.querySelectorAll('.test-list-item').forEach(item => {
        const title = item.querySelector('.test-item-title')?.textContent?.toLowerCase() || '';
        const file = item.querySelector('.test-item-file')?.textContent?.toLowerCase() || '';
        const matches = title.includes(lowerQuery) || file.includes(lowerQuery);
        item.style.display = matches ? 'flex' : 'none';
      });

      // Also handle old test-card format for grouped view
      document.querySelectorAll('.test-card').forEach(card => {
        const title = card.querySelector('.test-title')?.textContent?.toLowerCase() || '';
        const file = card.querySelector('.test-file')?.textContent?.toLowerCase() || '';
        const matches = title.includes(lowerQuery) || file.includes(lowerQuery);
        card.style.display = matches ? 'block' : 'none';
      });

      // Also show/hide file groups if all tests are hidden
      document.querySelectorAll('.file-group').forEach(group => {
        const hasVisible = Array.from(group.querySelectorAll('.test-card')).some(
          card => card.style.display !== 'none'
        );
        group.style.display = hasVisible ? 'block' : 'none';
      });

      // Check for empty state
      checkEmptyState();
    }

    // Active filters state - organized by group
    const activeFilters = {
      attention: new Set(),
      status: new Set(),
      health: new Set(),
      grade: new Set(),
      suite: new Set(),
      tag: new Set(),
      'context-project': new Set(), // Phase 2: org/team/app chips
      'context-build': new Set(),   // Phase 2: playwright project chips
      'context-custom': new Set(),  // Phase 7: custom metadata chips
    };

    /* ============================================
       PHASE 2: COLLAPSIBLE FILTER GROUPS
    ============================================ */

    // Read report metadata embedded by the generator
    let reportMetadata = {};
    try {
      const metaEl = document.getElementById('report-metadata');
      if (metaEl) reportMetadata = JSON.parse(metaEl.textContent || '{}');
    } catch { /* ignore */ }

    function toggleFilterGroup(groupId) {
      const group = document.querySelector(\`.filter-group-collapsible[data-group="\${groupId}"]\`);
      if (!group) return;
      const body = document.getElementById('filter-body-' + groupId);
      const header = group.querySelector('.filter-group-header');
      const chevron = group.querySelector('.filter-group-chevron');
      if (!body || !header) return;

      const isCollapsed = body.style.display === 'none';
      body.style.display = isCollapsed ? '' : 'none';
      header.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
      if (chevron) chevron.textContent = isCollapsed ? '▾' : '▸';

      // Persist to localStorage
      try {
        localStorage.setItem('sr-filter-collapsed-' + groupId, isCollapsed ? 'false' : 'true');
      } catch { /* ignore */ }
    }

    function initCollapsibleGroups() {
      document.querySelectorAll('.filter-group-collapsible').forEach(group => {
        const groupId = group.dataset.group;
        if (!groupId) return;
        let collapsed = false;
        try {
          collapsed = localStorage.getItem('sr-filter-collapsed-' + groupId) === 'true';
        } catch { /* ignore */ }

        if (collapsed) {
          const body = document.getElementById('filter-body-' + groupId);
          const header = group.querySelector('.filter-group-header');
          const chevron = group.querySelector('.filter-group-chevron');
          if (body) body.style.display = 'none';
          if (header) header.setAttribute('aria-expanded', 'false');
          if (chevron) chevron.textContent = '▸';
        }
      });
    }

    function updateFilterGroupBadge(groupId) {
      const badge = document.getElementById(groupId + '-badge');
      if (!badge) return;
      const count = activeFilters[groupId] ? activeFilters[groupId].size : 0;
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    function toggleFilter(chip) {
      const filter = chip.dataset.filter;
      const group = chip.dataset.group;

      // Toggle the filter in the appropriate group
      if (activeFilters[group].has(filter)) {
        activeFilters[group].delete(filter);
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      } else {
        activeFilters[group].add(filter);
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
      }

      // Update badge on collapsible group headers (Phase 2)
      updateFilterGroupBadge(group);

      applyFilters();
    }

    function clearAllFilters() {
      activeFilters.attention.clear();
      activeFilters.status.clear();
      activeFilters.health.clear();
      activeFilters.grade.clear();
      activeFilters.suite.clear();
      activeFilters.tag.clear();
      activeFilters['context-project'].clear();
      activeFilters['context-build'].clear();
      activeFilters['context-custom'].clear();
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      });
      updateFilterGroupBadge('context-project');
      updateFilterGroupBadge('context-build');
      updateFilterGroupBadge('context-custom');
      applyFilters();
    }

    function applyFilters() {
      const hasAttentionFilters = activeFilters.attention.size > 0;
      const hasStatusFilters = activeFilters.status.size > 0;
      const hasHealthFilters = activeFilters.health.size > 0;
      const hasGradeFilters = activeFilters.grade.size > 0;
      const hasSuiteFilters = activeFilters.suite.size > 0;
      const hasTagFilters = activeFilters.tag.size > 0;
      const hasContextProjectFilters = activeFilters['context-project'].size > 0;
      const hasContextBuildFilters = activeFilters['context-build'].size > 0;
      const hasContextCustomFilters = activeFilters['context-custom'].size > 0;
      const hasAnyFilter = hasAttentionFilters || hasStatusFilters || hasHealthFilters || hasGradeFilters || hasSuiteFilters || hasTagFilters || hasContextProjectFilters || hasContextBuildFilters || hasContextCustomFilters;

      // Phase 2: match org/team/app — checks data-org, data-team, data-app attributes on test elements.
      // Items without these attributes belong to the current report's project context so they match any chip.
      function matchesContextProjectFilter(el) {
        if (!hasContextProjectFilters) return true;
        for (const filter of activeFilters['context-project']) {
          const parts = filter.split('-');
          const dimKey = parts[0]; // org | team | app
          const val = parts.slice(1).join('-'); // rejoin in case value contains dashes
          const elVal = el.dataset[dimKey] || '';
          // Missing attribute = item belongs to the current project context → always matches
          if (elVal === '' || elVal === val) return true;
        }
        return false;
      }

      // Phase 2 / Phase 2-ext: match playwright project, browser, branch, env, release
      function matchesContextBuildFilter(el) {
        if (!hasContextBuildFilters) return true;
        const buildFilters = [...activeFilters['context-build']];

        // Playwright project — OR within group
        const pwProjectFilters = buildFilters.filter(f => f.startsWith('pwproject-'));
        if (pwProjectFilters.length > 0) {
          const elProject = el.dataset.project || '';
          if (!pwProjectFilters.some(f => f.slice('pwproject-'.length) === elProject)) return false;
        }

        // Browser — OR within group
        const browserFilters = buildFilters.filter(f => f.startsWith('browser-'));
        if (browserFilters.length > 0) {
          const elBrowser = el.dataset.browser || '';
          if (!browserFilters.some(f => f.slice('browser-'.length) === elBrowser)) return false;
        }

        // Branch — OR within group; reads data-branch set from run-level projectDataAttrs
        const branchFilters = buildFilters.filter(f => f.startsWith('branch-'));
        if (branchFilters.length > 0) {
          const elBranch = el.dataset.branch || '';
          if (!branchFilters.some(f => f.slice('branch-'.length) === elBranch)) return false;
        }

        // Environment — OR within group
        const envFilters = buildFilters.filter(f => f.startsWith('env-'));
        if (envFilters.length > 0) {
          const elEnv = el.dataset.env || '';
          if (!envFilters.some(f => f.slice('env-'.length) === elEnv)) return false;
        }

        // Release version — OR within group
        const releaseFilters = buildFilters.filter(f => f.startsWith('release-'));
        if (releaseFilters.length > 0) {
          const elRelease = el.dataset.release || '';
          if (!releaseFilters.some(f => f.slice('release-'.length) === elRelease)) return false;
        }

        return true;
      }

      // Phase 7: match custom metadata — AND across fields, OR within field values.
      // Each chip data-filter is "{safeKey}-{value}"; el carries data-custom-{safeKey}="{value}".
      function matchesContextCustomFilter(el) {
        if (!hasContextCustomFilters) return true;
        // Group active chips by field key (prefix before first '-')
        const byField = new Map();
        for (const filter of activeFilters['context-custom']) {
          const dashIdx = filter.indexOf('-');
          if (dashIdx === -1) continue;
          const fieldKey = filter.slice(0, dashIdx);
          const fieldVal = filter.slice(dashIdx + 1);
          if (!byField.has(fieldKey)) byField.set(fieldKey, new Set());
          byField.get(fieldKey).add(fieldVal);
        }
        // AND across fields: every active field must match (OR within its values)
        for (const [fieldKey, allowedVals] of byField) {
          const elVal = el.getAttribute('data-custom-' + fieldKey) || '';
          if (!allowedVals.has(elVal)) return false;
        }
        return true;
      }

      // Helper to check if element matches suite filter
      function matchesSuiteFilter(el) {
        if (!hasSuiteFilters) return true;
        const suiteData = el.dataset.suite || '';
        const suitesData = el.dataset.suites || '';
        for (const filter of activeFilters.suite) {
          const suiteName = filter.replace('suite-', '');
          if (suiteData === suiteName || suitesData.split(',').includes(suiteName)) return true;
        }
        return false;
      }

      // Helper to check if element matches tag filter
      function matchesTagFilter(el) {
        if (!hasTagFilters) return true;
        const tagsData = el.dataset.tags || '';
        const tags = tagsData.split(',').filter(t => t);
        for (const filter of activeFilters.tag) {
          const tagName = filter.replace('tag-', '');
          if (tags.includes(tagName)) return true;
        }
        return false;
      }

      // Filter test list items
      document.querySelectorAll('.test-list-item').forEach(item => {
        const status = item.dataset.status;
        const isFlaky = item.dataset.flaky === 'true';
        const isSlow = item.dataset.slow === 'true';
        const isNew = item.dataset.new === 'true';
        const isNewFailure = item.dataset.newFailure === 'true';
        const isRegression = item.dataset.regression === 'true';
        const isFixed = item.dataset.fixed === 'true';
        const grade = item.dataset.grade;

        // If no filters active, show all
        if (!hasAnyFilter) {
          item.style.display = 'flex';
          return;
        }

        // Check each filter group (OR within group, AND between groups)
        let matchesAttention = !hasAttentionFilters;
        let matchesStatus = !hasStatusFilters;
        let matchesHealth = !hasHealthFilters;
        let matchesGrade = !hasGradeFilters;

        // Attention group - OR logic
        if (hasAttentionFilters) {
          matchesAttention =
            (activeFilters.attention.has('new-failure') && isNewFailure) ||
            (activeFilters.attention.has('regression') && isRegression) ||
            (activeFilters.attention.has('fixed') && isFixed);
        }

        // Status group - OR logic
        if (hasStatusFilters) {
          matchesStatus =
            (activeFilters.status.has('passed') && status === 'passed') ||
            (activeFilters.status.has('failed') && (status === 'failed' || status === 'timedOut')) ||
            (activeFilters.status.has('skipped') && status === 'skipped');
        }

        // Health group - OR logic
        if (hasHealthFilters) {
          matchesHealth =
            (activeFilters.health.has('flaky') && isFlaky) ||
            (activeFilters.health.has('slow') && isSlow) ||
            (activeFilters.health.has('new') && isNew);
        }

        // Grade group - OR logic
        if (hasGradeFilters) {
          matchesGrade =
            (activeFilters.grade.has('grade-a') && grade === 'A') ||
            (activeFilters.grade.has('grade-b') && grade === 'B') ||
            (activeFilters.grade.has('grade-c') && grade === 'C') ||
            (activeFilters.grade.has('grade-d') && grade === 'D') ||
            (activeFilters.grade.has('grade-f') && grade === 'F');
        }

        // Suite and Tag groups
        const matchesSuite = matchesSuiteFilter(item);
        const matchesTag = matchesTagFilter(item);

        // Phase 2: context filters
        const matchesContextProject = matchesContextProjectFilter(item);
        const matchesContextBuild = matchesContextBuildFilter(item);
        // Phase 7: custom metadata filters
        const matchesContextCustom = matchesContextCustomFilter(item);

        // AND between groups
        const show = matchesAttention && matchesStatus && matchesHealth && matchesGrade && matchesSuite && matchesTag && matchesContextProject && matchesContextBuild && matchesContextCustom;
        item.style.display = show ? 'flex' : 'none';
      });

      // Also filter test-cards in hidden container and file groups
      document.querySelectorAll('.test-card').forEach(card => {
        const status = card.dataset.status;
        const isFlaky = card.dataset.flaky === 'true';
        const isSlow = card.dataset.slow === 'true';
        const isNew = card.dataset.new === 'true';
        const isNewFailure = card.dataset.newFailure === 'true';
        const isRegression = card.dataset.regression === 'true';
        const isFixed = card.dataset.fixed === 'true';
        const grade = card.dataset.grade;

        if (!hasAnyFilter) {
          card.style.display = 'block';
          return;
        }

        let matchesAttention = !hasAttentionFilters;
        let matchesStatus = !hasStatusFilters;
        let matchesHealth = !hasHealthFilters;
        let matchesGrade = !hasGradeFilters;

        if (hasAttentionFilters) {
          matchesAttention =
            (activeFilters.attention.has('new-failure') && isNewFailure) ||
            (activeFilters.attention.has('regression') && isRegression) ||
            (activeFilters.attention.has('fixed') && isFixed);
        }

        if (hasStatusFilters) {
          matchesStatus =
            (activeFilters.status.has('passed') && status === 'passed') ||
            (activeFilters.status.has('failed') && (status === 'failed' || status === 'timedOut')) ||
            (activeFilters.status.has('skipped') && status === 'skipped');
        }

        if (hasHealthFilters) {
          matchesHealth =
            (activeFilters.health.has('flaky') && isFlaky) ||
            (activeFilters.health.has('slow') && isSlow) ||
            (activeFilters.health.has('new') && isNew);
        }

        if (hasGradeFilters) {
          matchesGrade =
            (activeFilters.grade.has('grade-a') && grade === 'A') ||
            (activeFilters.grade.has('grade-b') && grade === 'B') ||
            (activeFilters.grade.has('grade-c') && grade === 'C') ||
            (activeFilters.grade.has('grade-d') && grade === 'D') ||
            (activeFilters.grade.has('grade-f') && grade === 'F');
        }

        // Suite and Tag groups
        const matchesSuite = matchesSuiteFilter(card);
        const matchesTag = matchesTagFilter(card);

        // Phase 2: context filters
        const matchesContextProject = matchesContextProjectFilter(card);
        const matchesContextBuild = matchesContextBuildFilter(card);
        // Phase 7: custom metadata filters
        const matchesContextCustom = matchesContextCustomFilter(card);

        const show = matchesAttention && matchesStatus && matchesHealth && matchesGrade && matchesSuite && matchesTag && matchesContextProject && matchesContextBuild && matchesContextCustom;
        card.style.display = show ? 'block' : 'none';
      });

      // Update group visibility
      document.querySelectorAll('.file-group').forEach(group => {
        const hasVisible = Array.from(group.querySelectorAll('.test-list-item, .test-card')).some(
          el => el.style.display !== 'none'
        );
        group.style.display = hasVisible ? 'block' : 'none';
      });

      // Clear file tree selection
      document.querySelectorAll('.file-tree-item').forEach(item => {
        item.classList.remove('active');
      });

      // Update sidebar stat bubbles to reflect visible counts
      updateStatBubbles();

      // Check for empty state
      checkEmptyState();

      // Keep trend chart bars in sync with active branch/env filters
      filterTrendBars();
    }

    function updateStatBubbles() {
      const items = document.querySelectorAll('.test-tab-content.active .test-list-item');
      const hasAnyFilter = Object.values(activeFilters).some(s => s.size > 0);
      if (!hasAnyFilter) {
        // Restore originals from the data attribute (set once on page load)
        const statPassed = document.getElementById('stat-passed');
        const statFailed = document.getElementById('stat-failed');
        const statFlaky  = document.getElementById('stat-flaky');
        if (statPassed) statPassed.textContent = statPassed.dataset.total ?? statPassed.textContent;
        if (statFailed) statFailed.textContent = statFailed.dataset.total ?? statFailed.textContent;
        if (statFlaky)  statFlaky.textContent  = statFlaky.dataset.total  ?? statFlaky.textContent;
        return;
      }
      let p = 0, f = 0, fl = 0;
      items.forEach(item => {
        if (item.style.display === 'none') return;
        const status = item.dataset.status;
        if (status === 'passed') p++;
        else if (status === 'failed' || status === 'timedOut') f++;
        if (item.dataset.flaky === 'true') fl++;
      });
      const statPassed = document.getElementById('stat-passed');
      const statFailed = document.getElementById('stat-failed');
      const statFlaky  = document.getElementById('stat-flaky');
      if (statPassed) statPassed.textContent = String(p);
      if (statFailed) statFailed.textContent = String(f);
      if (statFlaky)  statFlaky.textContent  = String(fl);
    }

    function checkEmptyState() {
      const visibleItems = document.querySelectorAll('.test-tab-content.active .test-list-item:not([style*="display: none"])');
      const emptyState = document.getElementById('emptyState');
      const tabs = document.querySelectorAll('.test-tab-content');

      if (visibleItems.length === 0) {
        emptyState.style.display = 'flex';
        tabs.forEach(tab => tab.style.opacity = '0.3');
      } else {
        emptyState.style.display = 'none';
        tabs.forEach(tab => tab.style.opacity = '1');
      }
    }

    // Legacy single-filter function for backward compatibility
    function filterTests(filter) {
      switchView('tests');
      clearAllFilters();
      if (filter !== 'all') {
        const chip = document.querySelector('.filter-chip[data-filter="' + filter + '"]');
        if (chip) toggleFilter(chip);
      }
    }

    /* ============================================
       KEYBOARD SHORTCUTS
    ============================================ */

    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          closeSearch();
        }
        return;
      }

      // Command/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
        return;
      }

      // Command/Ctrl + B for sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Escape to close search
      if (e.key === 'Escape') {
        closeSearch();
      }

      // Arrow navigation in test list
      if (currentView === 'tests') {
        const items = Array.from(document.querySelectorAll('.test-list-item:not([style*="display: none"])'));
        const selectedItem = document.querySelector('.test-list-item.selected');
        let currentIndex = selectedItem ? items.indexOf(selectedItem) : -1;

        if (e.key === 'ArrowDown' || e.key === 'j') {
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, items.length - 1);
          if (items[currentIndex]) {
            const testId = items[currentIndex].id.replace('list-item-', '');
            selectTest(testId);
            items[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } else if (e.key === 'ArrowUp' || e.key === 'k') {
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          if (items[currentIndex]) {
            const testId = items[currentIndex].id.replace('list-item-', '');
            selectTest(testId);
            items[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      }

      // Old keyboard nav for test cards
      const cards = Array.from(document.querySelectorAll('.test-card:not([style*="display: none"])'));
      const focused = document.querySelector('.test-card.keyboard-focus');
      let currentIndex = focused ? cards.indexOf(focused) : -1;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        if (cards.length > 0 && !document.querySelector('.test-list-item.selected')) {
          e.preventDefault();
          if (focused) focused.classList.remove('keyboard-focus');
          currentIndex = Math.min(currentIndex + 1, cards.length - 1);
          if (cards[currentIndex]) {
            cards[currentIndex].classList.add('keyboard-focus');
            cards[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        if (cards.length > 0 && !document.querySelector('.test-list-item.selected')) {
          e.preventDefault();
          if (focused) focused.classList.remove('keyboard-focus');
          currentIndex = Math.max(currentIndex - 1, 0);
          if (cards[currentIndex]) {
            cards[currentIndex].classList.add('keyboard-focus');
            cards[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      } else if (e.key === 'Enter' && focused) {
        e.preventDefault();
        const header = focused.querySelector('.test-card-header');
        if (header) header.click();
      } else if (e.key === 'Escape' && focused) {
        focused.classList.remove('keyboard-focus');
      }
    });

    /* ============================================
       EXISTING FUNCTIONS (preserved)
    ============================================ */

    function toggleDetails(id, event) {
      // If called from click event, find the parent card from the clicked element
      // This handles cloned cards in the detail panel that share the same ID
      let card;
      if (event && event.currentTarget) {
        card = event.currentTarget.closest('.test-card');
      }
      if (!card) {
        card = document.getElementById('card-' + id);
      }
      if (card) {
        card.classList.toggle('expanded');
      }
    }

    function toggleGroup(groupId) {
      const group = document.getElementById('group-' + groupId);
      group.classList.toggle('collapsed');
    }

    function toggleSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.toggle('collapsed');
      }
    }

    function toggleNetworkEntry(entryId) {
      const entry = document.querySelector('[data-entry-id="' + entryId + '"]');
      const details = document.getElementById(entryId + '-details');
      if (entry && details) {
        entry.classList.toggle('expanded');
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
      }
    }

    function copyCode(codeId, btn) {
      const codeEl = document.getElementById(codeId);
      if (!codeEl) return;

      const text = codeEl.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        showToast('Copied to clipboard', 'success');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(() => {
        btn.textContent = 'Failed';
        showToast('Failed to copy', 'error');
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    }

    function exportJSON() {
      const data = {
        timestamp: new Date().toISOString(),
        summary: {
          total: tests.length,
          passed: tests.filter(t => t.status === 'passed').length,
          failed: tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length,
          skipped: tests.filter(t => t.status === 'skipped').length,
        },
        tests: tests
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-results-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('JSON exported successfully', 'success');
      closeExportMenu();
    }

    // CSV Export
    function exportCSV() {
      const headers = ['Title', 'File', 'Status', 'Duration (ms)', 'Flakiness Score', 'Stability Grade', 'Retries'];
      const rows = tests.map(t => [
        '"' + (t.title || '').replace(/"/g, '""') + '"',
        '"' + (t.file || '').replace(/"/g, '""') + '"',
        t.status || '',
        t.duration || 0,
        t.flakinessScore || '',
        t.stabilityScore?.grade || '',
        t.retry || 0
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-results-' + new Date().toISOString().split('T')[0] + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('CSV exported successfully', 'success');
      closeExportMenu();
    }

    // Console log panel toggle
    function toggleConsolePanel(labelEl) {
      const panel = labelEl.nextElementSibling;
      const icon = labelEl.querySelector('.collapse-icon');
      if (!panel) return;
      const isHidden = panel.style.display === 'none' || panel.style.display === '';
      panel.style.display = isHidden ? 'block' : 'none';
      if (icon) icon.textContent = isHidden ? '▼' : '▶';
    }

    // ============================================
    // ARTIFACT DOWNLOADS
    // ============================================

    function triggerDownload(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function sanitizeForFilename(str) {
      return (str || 'test').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    }

    // Download all artifacts for a single test as a client-side ZIP (uses JSZip, always bundled)
    async function downloadTestArtifacts(testId) {
      if (typeof JSZip === 'undefined') {
        showToast('ZIP library not available', 'error');
        return;
      }
      const test = tests.find((t) => t.testId === testId);
      if (!test) return;

      try {
        const zip = new JSZip();
        const folder = zip.folder(sanitizeForFilename(test.title));

        // Screenshots — available in screenshotsData (full base64) not in lightenedResults
        const shots = (screenshotsData && screenshotsData[testId]) || [];
        shots.forEach((s, i) => {
          if (s && s.startsWith('data:')) {
            const comma = s.indexOf(',');
            const header = s.slice(0, comma);
            const b64 = s.slice(comma + 1);
            const ext = header.includes('png') ? 'png' : 'jpg';
            folder.file('screenshot-' + i + '.' + ext, b64, { base64: true });
          }
        });

        // Trace file paths — note them as text (can't fetch in file:// context)
        (test.attachments && test.attachments.traces || []).forEach((t, i) => {
          if (t) folder.file('trace-path-' + i + '.txt', 'Trace: ' + t + '\\nView with: npx playwright show-trace "' + t + '"');
        });

        // Custom inline attachments
        ((test.attachments && test.attachments.custom) || []).forEach((c, i) => {
          const name = c.name || ('attachment-' + i);
          if (c.body && c.body !== '[base64-content]') {
            folder.file(name, c.body, { base64: true });
          } else if (c.path) {
            folder.file(name + '-path.txt', 'File: ' + c.path);
          }
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(blob, 'artifacts-' + sanitizeForFilename(test.title) + '.zip');
        showToast('Artifacts downloaded', 'success');
      } catch (err) {
        showToast('ZIP failed: ' + (err.message || err), 'error');
      }
    }

    // Download all failure artifacts as a single ZIP
    async function downloadAllFailuresZip() {
      if (typeof JSZip === 'undefined') {
        showToast('ZIP library not available', 'error');
        return;
      }
      const failures = tests.filter((t) => t.status === 'failed' || t.status === 'timedOut');
      if (failures.length === 0) {
        showToast('No failures to download', 'info');
        return;
      }
      try {
        const zip = new JSZip();
        for (const test of failures) {
          const folder = zip.folder(sanitizeForFilename(test.title));
          // Screenshots from screenshotsData
          const shots = (screenshotsData && screenshotsData[test.testId]) || [];
          shots.forEach((s, i) => {
            if (s && s.startsWith('data:')) {
              const comma = s.indexOf(',');
              const b64 = s.slice(comma + 1);
              const ext = s.slice(0, comma).includes('png') ? 'png' : 'jpg';
              folder.file('screenshot-' + i + '.' + ext, b64, { base64: true });
            }
          });
          // Error text
          if (test.error) {
            folder.file('error.txt', test.error);
          }
        }
        const date = new Date().toISOString().split('T')[0];
        const blob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(blob, 'failures-' + date + '.zip');
        showToast('Failures ZIP downloaded (' + failures.length + ' tests)', 'success');
      } catch (err) {
        showToast('ZIP failed: ' + (err.message || err), 'error');
      }
    }

    // Download HAR file from network logs for a test
    function downloadHar(testId) {
      if (!networkLogsData || !networkLogsData[testId]) {
        showToast('No network logs available for this test', 'info');
        return;
      }
      const test = tests.find((t) => t.testId === testId);
      const netLogs = networkLogsData[testId];

      const har = {
        log: {
          version: '1.2',
          creator: { name: 'playwright-smart-reporter', version: '1.0.0' },
          entries: netLogs.entries.map((e) => ({
            startedDateTime: e.timestamp,
            time: e.duration,
            request: {
              method: e.method,
              url: e.url,
              httpVersion: 'HTTP/1.1',
              cookies: [],
              headers: Object.entries(e.requestHeaders || {}).map(([name, value]) => ({ name, value })),
              queryString: [],
              headersSize: -1,
              bodySize: e.requestSize || -1,
              ...(e.requestBody ? {
                postData: {
                  mimeType: 'application/json',
                  text: typeof e.requestBody === 'string' ? e.requestBody : JSON.stringify(e.requestBody),
                },
              } : {}),
            },
            response: {
              status: e.status,
              statusText: e.statusText || '',
              httpVersion: 'HTTP/1.1',
              cookies: [],
              headers: Object.entries(e.responseHeaders || {}).map(([name, value]) => ({ name, value })),
              content: { size: e.responseSize || -1, mimeType: e.contentType || 'application/octet-stream' },
              redirectURL: '',
              headersSize: -1,
              bodySize: e.responseSize || -1,
            },
            cache: {},
            timings: e.timings
              ? { dns: e.timings.dns, connect: e.timings.connect, ssl: e.timings.ssl, send: 0, wait: e.timings.wait, receive: e.timings.receive }
              : { send: 0, wait: e.duration, receive: 0 },
          })),
        },
      };

      const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
      const name = test ? sanitizeForFilename(test.title) : sanitizeForFilename(testId);
      triggerDownload(blob, 'network-' + name + '.har');
      showToast('HAR downloaded', 'success');
    }

    // Export menu toggle
    function toggleSettingsMenu() {
      const dropdown = document.getElementById('settingsDropdown');
      const btn = dropdown.querySelector('.top-bar-icon-btn');
      dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(dropdown.classList.contains('open')));
    }

    function closeSettingsMenu() {
      const dropdown = document.getElementById('settingsDropdown');
      if (!dropdown) return;
      const btn = dropdown.querySelector('.top-bar-icon-btn');
      dropdown.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    // Close settings menu when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('settingsDropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        closeSettingsMenu();
      }
    });

    // Toast notifications
    function showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;

      const icons = { success: '✓', error: '✗', info: 'ℹ' };
      toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span class="toast-message">' + message + '</span>';

      container.appendChild(toast);

      // Trigger animation
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });

      // Remove after delay
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    function setTheme(theme) {
      const root = document.documentElement;

      // Update active state on theme items in the settings menu
      document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.toggle('active', item.dataset.theme === theme);
      });

      if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        showToast('Light theme', 'info');
      } else if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        showToast('Dark theme', 'info');
      } else {
        root.removeAttribute('data-theme');
        localStorage.setItem('theme', 'system');
        showToast('Using system theme', 'info');
      }
    }

    // Initialize theme from localStorage
    (function initTheme() {
      const saved = localStorage.getItem('theme') || 'system';

      document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.toggle('active', item.dataset.theme === saved);
      });

      if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();

    // Auto-scroll secondary charts to show most recent run
    function scrollChartsToRight() {
      document.querySelectorAll('.secondary-trend-chart').forEach(chart => {
        chart.scrollLeft = chart.scrollWidth;
      });
    }

    function escapeHtmlUnsafe(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

	    function formatDurationMs(ms) {
	      const n = Number(ms) || 0;
	      if (n < 1000) return Math.round(n) + 'ms';
	      if (n < 60000) return (n / 1000).toFixed(1) + 's';
	      return (n / 60000).toFixed(1) + 'm';
	    }

	    function getRunSnapshot(runId) {
	      if (!historyRunSnapshots || !runId) return null;
	      return historyRunSnapshots[runId] || null;
	    }

	    function renderSnapshotBody(snapshot, avgDuration) {
	      const parts = [];

	      if (snapshot.steps && snapshot.steps.length > 0) {
	        const max = snapshot.steps.reduce((m, s) => Math.max(m, Number(s.duration) || 0), 0) || 1;
	        const rows = snapshot.steps.map(step => {
	          const w = Math.max(0, Math.min(100, ((Number(step.duration) || 0) / max) * 100));
	          const slowest = step && step.isSlowest ? true : false;
	          return (
	            '<div class="step-row' + (slowest ? ' slowest' : '') + '">' +
	              '<span class="step-title" title="' + escapeHtmlUnsafe(step.title) + '">' + escapeHtmlUnsafe(step.title) + '</span>' +
	              '<div class="step-bar-container"><div class="step-bar" style="width: ' + w.toFixed(1) + '%"></div></div>' +
	              '<span class="step-duration">' + escapeHtmlUnsafe(formatDurationMs(step.duration)) + '</span>' +
	              (slowest ? '<span class="slowest-badge">Slowest</span>' : '') +
	            '</div>'
	          );
	        }).join('');
        parts.push(
          '<div class="detail-section">' +
            '<div class="detail-label"><span class="icon">⏱</span> Step Timings</div>' +
            '<div class="steps-container">' + rows + '</div>' +
	          '</div>'
	        );
	      }

	      if (snapshot.error) {
	        parts.push(
	          '<div class="detail-section">' +
	            '<div class="detail-label"><span class="icon">⚠</span> Error</div>' +
	            '<div class="error-box">' + escapeHtmlUnsafe(snapshot.error) + '</div>' +
	          '</div>'
	        );
	      }

	      if (snapshot.attachments && snapshot.attachments.screenshots && snapshot.attachments.screenshots.length > 0) {
	        const first = snapshot.attachments.screenshots[0];
	        parts.push(
	          '<div class="detail-section">' +
            '<div class="detail-label"><span class="icon">📸</span> Screenshot</div>' +
            '<div class="screenshot-box">' +
              '<img src="' + escapeHtmlUnsafe(first) + '" alt="Screenshot" onclick="window.open(this.src, \\'_blank\\')" onerror="this.style.display=\\'none\\'; this.nextElementSibling.style.display=\\'flex\\';"/>' +
              '<div class="screenshot-fallback" style="display:none;">' +
                '<span>Image blocked by security policy</span>' +
                '<a href="' + escapeHtmlUnsafe(first) + '" download class="download-btn">Download Screenshot</a>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }

      if (snapshot.attachments && snapshot.attachments.videos && snapshot.attachments.videos.length > 0) {
        parts.push(
          '<div class="detail-section">' +
            '<div class="detail-label"><span class="icon">📎</span> Attachments</div>' +
            '<div class="attachments">' +
              '<a href="' + escapeHtmlUnsafe(snapshot.attachments.videos[0]) + '" class="attachment-link" target="_blank">🎬 Video</a>' +
            '</div>' +
          '</div>'
        );
      }

	      if (snapshot.aiSuggestion) {
	        const aiHtml = snapshot.aiSuggestionHtml
	          ? String(snapshot.aiSuggestionHtml)
	          : escapeHtmlUnsafe(snapshot.aiSuggestion);
	        parts.push(
	          '<div class="detail-section">' +
	            '<div class="detail-label"><span class="icon">🤖</span> AI Suggestion</div>' +
	            '<div class="ai-box ai-markdown">' + aiHtml + '</div>' +
	          '</div>'
	        );
	      }

	      if (Number.isFinite(Number(avgDuration)) && Number(avgDuration) > 0) {
	        parts.push(
	          '<div class="duration-compare">Average: ' +
	            escapeHtmlUnsafe(formatDurationMs(avgDuration)) +
	            ' → Current: ' +
	            escapeHtmlUnsafe(formatDurationMs(snapshot.duration)) +
	          '</div>'
	        );
	      }

	      if (parts.length === 0) {
	        parts.push('<div class="duration-compare">No additional data recorded for this run.</div>');
	      }

	      return parts.join('');
	    }

	    function showBackButton(card, show) {
	      const btn = card.querySelector('.history-back-btn');
	      if (!btn) return;
	      btn.style.display = show ? 'inline-flex' : 'none';
	    }

	    function clearSelectedDots(card) {
	      card.querySelectorAll('.history-dot.selected').forEach(d => d.classList.remove('selected'));
	    }

	    function clearSelectedDurationBars(card) {
	      card.querySelectorAll('.duration-bar.selected').forEach(b => b.classList.remove('selected'));
	    }

	    function getTestModel(testId) {
	      return tests.find(t => t && t.testId === testId) || null;
	    }

	    function computeAvgDurationFromHistory(testModel) {
	      const history = Array.isArray(testModel.history) ? testModel.history : [];
	      const nonSkipped = history.filter(h => !h.skipped);
	      if (nonSkipped.length === 0) return 0;
	      return nonSkipped.reduce((sum, h) => sum + (Number(h.duration) || 0), 0) / nonSkipped.length;
	    }

	    function updateTrendUI(card, testId, runId, selectedDuration) {
	      const testModel = getTestModel(testId);
	      if (!testModel) return;

	      const avg = computeAvgDurationFromHistory(testModel);
	      const avgEl = card.querySelector('[data-role="avg-duration"]');
	      const curEl = card.querySelector('[data-role="current-duration"]');
	      if (avgEl) avgEl.textContent = formatDurationMs(avg);
	      if (curEl) curEl.textContent = formatDurationMs(selectedDuration);

	      // Highlight the selected history duration bar (if present)
	      clearSelectedDurationBars(card);
	      if (runId) {
	        const selectedBar = card.querySelector('.duration-bar.history-duration[data-runid="' + CSS.escape(runId) + '"]');
	        if (selectedBar) selectedBar.classList.add('selected');
	      }
	    }

	    function restoreTrendUI(card, testId) {
	      const testModel = getTestModel(testId);
	      if (!testModel) return;

	      const avg = computeAvgDurationFromHistory(testModel);
	      const avgEl = card.querySelector('[data-role="avg-duration"]');
	      const curEl = card.querySelector('[data-role="current-duration"]');
	      if (avgEl) avgEl.textContent = formatDurationMs(avg);
	      if (curEl) curEl.textContent = formatDurationMs(testModel.duration);

	      clearSelectedDurationBars(card);
	    }

	    async function handleHistoryDotClick(dot) {
	      const runId = dot.getAttribute('data-runid');
	      const testId = dot.getAttribute('data-testid');
	      if (!runId || !testId) return;
	      const card = dot.closest('.test-card');
      if (!card) return;
      const details = card.querySelector('.test-details');
      const body = details ? details.querySelector('[data-details-body]') : null;
      if (!body) return;

      if (!detailsBodyCache.has(body)) {
        detailsBodyCache.set(body, body.innerHTML);
      }

	      const runData = getRunSnapshot(runId);
	      const snapshot = runData && runData.tests ? runData.tests[testId] : null;
	      if (!snapshot) {
	        alert('No stored snapshot for this test/run. (Older runs may have stored snapshots for failures only.)');
	        return;
	      }

	      clearSelectedDots(card);
	      clearSelectedDurationBars(card);
	      dot.classList.add('selected');
	      showBackButton(card, true);
	      const testModel = getTestModel(testId);
	      const avg = testModel ? computeAvgDurationFromHistory(testModel) : 0;
	      body.innerHTML = renderSnapshotBody(snapshot, avg);

	      // Sync Duration Trend UI to the selected run.
	      updateTrendUI(card, testId, runId, snapshot.duration);
	    }

	    function handleHistoryBackClick(btn) {
	      const card = btn.closest('.test-card');
	      if (!card) return;
	      const details = card.querySelector('.test-details');
	      const body = details ? details.querySelector('[data-details-body]') : null;
	      if (!body) return;
	      const testId = card.querySelector('.history-dot[data-testid]')?.getAttribute('data-testid') || null;
	      const original = detailsBodyCache.get(body);
	      if (typeof original === 'string') {
	        body.innerHTML = original;
	      }
	      clearSelectedDots(card);
	      clearSelectedDurationBars(card);
	      showBackButton(card, false);

	      if (testId) {
	        restoreTrendUI(card, testId);
	      }
	    }

	    function initHistoryDrilldown() {
	      if (!historyDrilldownEnabled) return;

	      document.addEventListener('click', async (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;

        const backBtn = t.closest('[data-action="history-back"]');
        if (backBtn) {
          e.preventDefault();
          handleHistoryBackClick(backBtn);
          return;
        }

	        const dot = t.closest('.history-dot[data-runid]');
	        if (dot) {
	          e.preventDefault();
	          handleHistoryDotClick(dot).catch(err => {
	            console.error(err);
	            alert('Unable to load historical run data.');
	          });
	        }
	      });
	    }

    // Run on page load
    window.addEventListener('DOMContentLoaded', () => {
      scrollChartsToRight();
      initHistoryDrilldown();
      initCollapsibleGroups(); // Phase 2: restore collapse state from localStorage
      if (!traceViewerEnabled) {
        document.querySelectorAll('[data-trace]').forEach(el => {
          el.style.display = 'none';
        });
      }
      // Store original totals in data-total so updateStatBubbles can restore them
      ['stat-passed', 'stat-failed', 'stat-flaky'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dataset.total = el.textContent;
      });
    });

${includeGallery ? `    // Gallery functions\n${generateGalleryScript()}` : ''}

${includeComparison ? `    // Comparison functions\n${generateComparisonScript()}` : ''}

    // Chart bar tooltips
    (function initChartTooltips() {
      const tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      document.body.appendChild(tooltip);

      document.querySelectorAll('.bar-group').forEach(bar => {
        bar.addEventListener('mouseenter', (e) => {
          const text = bar.getAttribute('data-tooltip');
          if (text) {
            tooltip.textContent = text;
            tooltip.style.display = 'block';
          }
        });

        bar.addEventListener('mousemove', (e) => {
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY - 30 + 'px';
        });

        bar.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      });
    })();

    /* ============================================
       VIRTUAL SCROLLING / PAGINATION
    ============================================ */
    (function initVirtualScroll() {
      const PAGE_SIZE = 50;
      const listContainer = document.querySelector('#tab-all [role="list"]');
      if (!listContainer) return;

      const allItems = Array.from(listContainer.children);
      if (allItems.length <= PAGE_SIZE) return;

      let visibleCount = PAGE_SIZE;

      // Initially hide items beyond page size
      allItems.forEach((item, i) => {
        if (i >= PAGE_SIZE) item.style.display = 'none';
      });

      // Add count indicator
      const countDiv = document.createElement('div');
      countDiv.className = 'test-list-item-count';
      countDiv.textContent = 'Showing ' + PAGE_SIZE + ' of ' + allItems.length + ' tests';
      listContainer.parentNode.insertBefore(countDiv, listContainer);

      // Add load more button
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.textContent = 'Load more tests...';
      loadMoreBtn.className = 'summary-card-btn';
      loadMoreBtn.style.cssText = 'margin: 12px auto; display: block;';
      loadMoreBtn.onclick = function() {
        const newCount = Math.min(visibleCount + PAGE_SIZE, allItems.length);
        for (let i = visibleCount; i < newCount; i++) {
          allItems[i].style.display = '';
        }
        visibleCount = newCount;
        countDiv.textContent = 'Showing ' + visibleCount + ' of ' + allItems.length + ' tests';
        if (visibleCount >= allItems.length) {
          loadMoreBtn.style.display = 'none';
          countDiv.textContent = 'Showing all ' + allItems.length + ' tests';
        }
      };
      listContainer.parentNode.appendChild(loadMoreBtn);

      // Listen for filter changes to reset pagination
      const observer = new MutationObserver(() => {
        const visibleItems = allItems.filter(item => !item.classList.contains('filter-hidden'));
        countDiv.textContent = 'Showing ' + visibleItems.length + ' of ' + allItems.length + ' tests';
      });
      observer.observe(listContainer, { childList: false, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    })();

    /* ============================================
       KEYBOARD-DRIVEN NAVIGATION
    ============================================ */
    (function initKeyboardNav() {
      // Create keyboard hints panel
      const hints = document.createElement('div');
      hints.className = 'keyboard-hints';
      hints.innerHTML = '<h4>Keyboard Shortcuts</h4>' +
        '<div class="keyboard-hint-row"><span>Navigate tests</span><kbd>j</kbd> <kbd>k</kbd></div>' +
        '<div class="keyboard-hint-row"><span>Next failure</span><kbd>f</kbd></div>' +
        '<div class="keyboard-hint-row"><span>Next flaky</span><kbd>n</kbd></div>' +
        '<div class="keyboard-hint-row"><span>Search</span><kbd>⌘K</kbd></div>' +
        '<div class="keyboard-hint-row"><span>Toggle sidebar</span><kbd>⌘B</kbd></div>' +
        '<div class="keyboard-hint-row"><span>Views (1-5)</span><kbd>1</kbd>-<kbd>5</kbd></div>' +
        '<div class="keyboard-hint-row"><span>Show/hide hints</span><kbd>?</kbd></div>' +
        '<div class="keyboard-hint-row"><span>Export summary</span><kbd>e</kbd></div>';
      document.body.appendChild(hints);

      function getVisibleTestItems() {
        return Array.from(document.querySelectorAll('.test-list-item')).filter(
          el => el.offsetParent !== null && el.style.display !== 'none'
        );
      }

      function getCurrentIndex(items) {
        return items.findIndex(el => el.classList.contains('selected'));
      }

      function selectByIndex(items, idx) {
        if (idx >= 0 && idx < items.length) {
          const testId = items[idx].id.replace('list-item-', '');
          selectTest(testId);
          items[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }

      document.addEventListener('keydown', function(e) {
        // Don't handle keys when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const items = getVisibleTestItems();
        const currentIdx = getCurrentIndex(items);

        switch(e.key) {
          case 'j': // Next test
            e.preventDefault();
            if (currentView !== 'tests') switchView('tests');
            selectByIndex(items, currentIdx < 0 ? 0 : currentIdx + 1);
            break;
          case 'k': // Previous test
            e.preventDefault();
            if (currentView !== 'tests') switchView('tests');
            selectByIndex(items, currentIdx < 0 ? 0 : currentIdx - 1);
            break;
          case 'f': // Next failure
            e.preventDefault();
            if (currentView !== 'tests') switchView('tests');
            for (let i = (currentIdx + 1); i < items.length; i++) {
              if (items[i].classList.contains('failed')) {
                selectByIndex(items, i);
                break;
              }
            }
            break;
          case 'n': // Next flaky
            e.preventDefault();
            if (currentView !== 'tests') switchView('tests');
            for (let i = (currentIdx + 1); i < items.length; i++) {
              if (items[i].dataset.flaky === 'true') {
                selectByIndex(items, i);
                break;
              }
            }
            break;
          case '?': // Toggle hints
            e.preventDefault();
            hints.classList.toggle('visible');
            break;
          case 'e': // Export summary
            e.preventDefault();
            if (typeof showSummaryExport === 'function') showSummaryExport();
            break;
          case '1': switchView('overview'); break;
          case '2': switchView('tests'); break;
          case '3': switchView('trends'); break;
          case '4':
            if (document.getElementById('view-comparison')) switchView('comparison');
            break;
          case '5':
            if (document.getElementById('view-gallery')) switchView('gallery');
            break;
          case 'Escape':
            hints.classList.remove('visible');
            break;
        }
      });
    })();

    /* ============================================
       EXPORTABLE SUMMARY CARD
    ============================================ */
    function showSummaryExport() {
      let modal = document.getElementById('summary-export-modal');
      if (modal) {
        modal.classList.add('visible');
        return;
      }

      const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      const barColor = passRate >= 90 ? 'var(--accent-green)' : passRate >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)';
      const timestamp = new Date().toLocaleString();

      modal = document.createElement('div');
      modal.id = 'summary-export-modal';
      modal.className = 'summary-export-modal visible';
      modal.innerHTML =
        '<div class="summary-card">' +
          '<div class="summary-card-title">Test Run Summary</div>' +
          '<div class="summary-card-subtitle">' + timestamp + '</div>' +
          '<div class="summary-card-stats">' +
            '<div class="summary-stat"><div class="summary-stat-value passed">' + stats.passed + '</div><div class="summary-stat-label">Passed</div></div>' +
            '<div class="summary-stat"><div class="summary-stat-value failed">' + stats.failed + '</div><div class="summary-stat-label">Failed</div></div>' +
            '<div class="summary-stat"><div class="summary-stat-value rate">' + passRate + '%</div><div class="summary-stat-label">Pass Rate</div></div>' +
          '</div>' +
          '<div class="summary-card-bar"><div class="summary-card-bar-fill" style="width: ' + passRate + '%; background: ' + barColor + ';"></div></div>' +
          '<div style="font-size: 0.75rem; color: var(--text-muted);">' +
            stats.total + ' total &bull; ' + stats.flaky + ' flaky &bull; ' + stats.slow + ' slow &bull; ' + stats.skipped + ' skipped' +
          '</div>' +
          '<div class="summary-card-footer">' +
            '<button class="summary-card-btn" onclick="closeSummaryExport()">Close</button>' +
            '<button class="summary-card-btn primary" onclick="copySummaryToClipboard()">Copy to Clipboard</button>' +
          '</div>' +
        '</div>';
      modal.addEventListener('click', function(e) { if (e.target === modal) closeSummaryExport(); });
      document.body.appendChild(modal);
    }

    function closeSummaryExport() {
      const modal = document.getElementById('summary-export-modal');
      if (modal) modal.classList.remove('visible');
    }

    function copySummaryToClipboard() {
      const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      const text = 'Test Run Summary\\n' +
        '═══════════════════\\n' +
        'Passed: ' + stats.passed + '/' + stats.total + ' (' + passRate + '%)\\n' +
        'Failed: ' + stats.failed + '\\n' +
        'Flaky: ' + stats.flaky + '\\n' +
        'Slow: ' + stats.slow + '\\n' +
        'Duration: ' + document.querySelector('.duration-value')?.textContent + '\\n' +
        'Date: ' + new Date().toLocaleString();
      navigator.clipboard.writeText(text).then(() => {
        showToast('Summary copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy', 'error');
      });
    }

    /* ── Settings UI ── */
    var settingsDefaults = {
      enableAIRecommendations: true,
      lmStudioBaseUrl: 'http://127.0.0.1:1234',
      lmStudioModel: '',
      smartReporterMaxTokens: 512,
      maxHistoryRuns: 10,
      filterPwApiSteps: false,
      enableHistoryDrilldown: true,
      enableTraceViewer: true,
      enableNetworkLogs: false,
      stabilityThreshold: 70,
      retryFailureThreshold: 3
    };

    function getSettings() {
      var saved = {};
      try { saved = JSON.parse(localStorage.getItem('smartReporterSettings') || '{}'); } catch(e) {}
      return Object.assign({}, settingsDefaults, reporterOptions, saved);
    }

    function saveSetting(key, value) {
      var saved = {};
      try { saved = JSON.parse(localStorage.getItem('smartReporterSettings') || '{}'); } catch(e) {}
      saved[key] = value;
      localStorage.setItem('smartReporterSettings', JSON.stringify(saved));
    }

    function openResetConfirm() {
      const modal = document.getElementById('confirm-modal');
      if (modal) { modal.setAttribute('aria-hidden', 'false'); modal.classList.add('open'); }
    }

    function closeResetConfirm() {
      const modal = document.getElementById('confirm-modal');
      if (modal) { modal.setAttribute('aria-hidden', 'true'); modal.classList.remove('open'); }
    }

    function resetSettings() {
      localStorage.removeItem('smartReporterSettings');
      initSettingsUI();
      showToast('Settings reset to defaults', 'success');
    }

    function switchSettingsTab(tab) {
      document.querySelectorAll('.settings-tab').forEach(function(t) {
        t.classList.toggle('active', t.dataset.tab === tab);
      });
      document.querySelectorAll('.settings-tab-panel').forEach(function(p) {
        p.classList.toggle('active', p.id === 'settings-tab-' + tab);
      });
    }

    function downloadSettings() {
      var s = getSettings();
      // Only export keys that playwright.config.ts reads from playwright-report-settings.json
      var validKeys = [
        'enableAIRecommendations', 'lmStudioBaseUrl', 'lmStudioModel',
        'smartReporterMaxTokens', 'maxHistoryRuns', 'filterPwApiSteps',
        'enableHistoryDrilldown', 'enableTraceViewer', 'enableNetworkLogs',
        'stabilityThreshold', 'retryFailureThreshold'
      ];
      var out = {};
      validKeys.forEach(function(k) { if (s[k] !== undefined) out[k] = s[k]; });
      var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'playwright-report-settings.json';
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Settings file downloaded', 'success');
    }

    function fetchLmStudioModels(baseUrl, selectedModel) {
      var select = document.getElementById('setting-lmStudioModel');
      var countEl = document.getElementById('setting-modelCount');
      if (!select) return;
      // Keep Auto-select, remove old model options
      while (select.options.length > 1) select.remove(1);
      if (countEl) countEl.textContent = '';
      fetch(baseUrl.replace(/\\/+$/, '') + '/v1/models')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var models = (data && data.data) || [];
          models.forEach(function(m) {
            var opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.id;
            select.appendChild(opt);
          });
          if (selectedModel) select.value = selectedModel;
          if (!select.value && selectedModel) {
            // Model not in list — add it as an option so it stays selected
            var opt = document.createElement('option');
            opt.value = selectedModel;
            opt.textContent = selectedModel;
            select.appendChild(opt);
            select.value = selectedModel;
          }
          if (countEl && models.length > 0) {
            countEl.textContent = models.length + ' model(s) available';
          }
        })
        .catch(function() {
          if (countEl) {
            countEl.textContent = 'Could not connect to LM Studio';
            countEl.style.color = 'var(--text-secondary)';
          }
          // If there's a saved model, add it as a manual option
          if (selectedModel) {
            var opt = document.createElement('option');
            opt.value = selectedModel;
            opt.textContent = selectedModel;
            select.appendChild(opt);
            select.value = selectedModel;
          }
        });
    }

    function initSettingsUI() {
      var s = getSettings();
      var el;
      el = document.getElementById('setting-enableAI');
      if (el) el.checked = !!s.enableAIRecommendations;
      el = document.getElementById('setting-lmStudioBaseUrl');
      if (el) el.value = s.lmStudioBaseUrl || '';
      fetchLmStudioModels(s.lmStudioBaseUrl || 'http://127.0.0.1:1234', s.lmStudioModel || '');
      el = document.getElementById('setting-maxTokens');
      if (el) el.value = s.smartReporterMaxTokens || 512;
      el = document.getElementById('setting-maxHistoryRuns');
      if (el) el.value = s.maxHistoryRuns || 10;
      el = document.getElementById('setting-filterPwApiSteps');
      if (el) el.checked = !!s.filterPwApiSteps;
      el = document.getElementById('setting-enableHistoryDrilldown');
      if (el) el.checked = !!s.enableHistoryDrilldown;
      el = document.getElementById('setting-enableTraceViewer');
      if (el) el.checked = !!s.enableTraceViewer;
      el = document.getElementById('setting-enableNetworkLogs');
      if (el) el.checked = !!s.enableNetworkLogs;
      el = document.getElementById('setting-stabilityThreshold');
      if (el) el.value = s.stabilityThreshold || 70;
      el = document.getElementById('setting-retryFailureThreshold');
      if (el) el.value = s.retryFailureThreshold || 3;
    }

    (function() { initSettingsUI(); })();

    /* ============================================
       PHASE 4: SAVED VIEWS
    ============================================ */

    const SAVED_VIEWS_KEY = 'sr-saved-views';
    const DELETED_VIEWS_KEY = 'sr-deleted-views';

    function getDeletedViewIds() {
      try { return new Set(JSON.parse(localStorage.getItem(DELETED_VIEWS_KEY) || '[]')); }
      catch { return new Set(); }
    }

    function getPersonalViews() {
      try { return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]'); }
      catch { return []; }
    }

    function loadSavedViews() {
      const deleted = getDeletedViewIds();
      const preSeeded = (reportMetadata.savedViews || []).filter(v => !deleted.has(v.id));
      const personal = getPersonalViews();
      // Personal views override pre-seeded ones with the same id
      const personalIds = new Set(personal.map(v => v.id));
      return [...preSeeded.filter(v => !personalIds.has(v.id)), ...personal];
    }

    function renderSavedViews() {
      const list = document.getElementById('saved-views-list');
      if (!list) return;
      const views = loadSavedViews();
      if (views.length === 0) {
        list.innerHTML = '<div class="sv-empty">No saved views yet</div>';
        return;
      }
      list.innerHTML = views.map(v => \`
        <div class="sv-item" data-id="\${escapeHtmlUnsafe(v.id)}">
          <button class="sv-apply-btn" onclick="applySavedView('\${escapeHtmlUnsafe(v.id)}')" title="\${v.description ? escapeHtmlUnsafe(v.description) : v.name}">
            <span class="sv-item-name">\${escapeHtmlUnsafe(v.name)}</span>
          </button>
          <button class="sv-delete-btn" onclick="deleteSavedView('\${escapeHtmlUnsafe(v.id)}')" title="Remove" aria-label="Delete view \${escapeHtmlUnsafe(v.name)}">×</button>
        </div>
      \`).join('');
    }

    function captureCurrentFilterState() {
      const f = {};
      if (activeFilters.status.size) f.status = [...activeFilters.status];
      if (activeFilters.health.size) f.health = [...activeFilters.health];
      if (activeFilters.grade.size) f.grade = [...activeFilters.grade].map(g => g.replace('grade-', '').toUpperCase());
      if (activeFilters.suite.size) f.suite = [...activeFilters.suite];
      if (activeFilters.tag.size) f.tags = [...activeFilters.tag].map(t => t.replace('tag-', ''));
      if (activeFilters['context-project'].size) {
        const orgs = [], teams = [], apps = [];
        for (const filter of activeFilters['context-project']) {
          const dash = filter.indexOf('-');
          if (dash < 0) continue;
          const dim = filter.slice(0, dash);
          const val = filter.slice(dash + 1);
          if (dim === 'org') orgs.push(val);
          else if (dim === 'team') teams.push(val);
          else if (dim === 'app') apps.push(val);
        }
        if (orgs.length) f.org = orgs;
        if (teams.length) f.team = teams;
        if (apps.length) f.app = apps;
      }
      if (activeFilters['context-build'].size) {
        const buildEntries = [...activeFilters['context-build']];
        const pw = buildEntries.filter(f => f.startsWith('pwproject-')).map(f => f.slice('pwproject-'.length));
        const browsers = buildEntries.filter(f => f.startsWith('browser-')).map(f => f.slice('browser-'.length));
        const branches = buildEntries.filter(f => f.startsWith('branch-')).map(f => f.slice('branch-'.length));
        const envs = buildEntries.filter(f => f.startsWith('env-')).map(f => f.slice('env-'.length));
        const releases = buildEntries.filter(f => f.startsWith('release-')).map(f => f.slice('release-'.length));
        if (pw.length) f.playwrightProject = pw;
        if (browsers.length) f.browsers = browsers;
        if (branches.length) f.branches = branches;
        if (envs.length) f.envs = envs;
        if (releases.length) f.releases = releases;
      }
      if (activeFilters['context-custom'].size) {
        f.custom = [...activeFilters['context-custom']];
      }
      return f;
    }

    function applyFilterState(f) {
      clearAllFilters();
      if (!f) return;
      (f.status || []).forEach(s => {
        const chip = document.querySelector(\`.filter-chip[data-filter="\${s}"][data-group="status"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.health || []).forEach(h => {
        const chip = document.querySelector(\`.filter-chip[data-filter="\${h}"][data-group="health"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.grade || []).forEach(g => {
        const chip = document.querySelector(\`.filter-chip[data-filter="grade-\${g.toLowerCase()}"][data-group="grade"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.suite || []).forEach(s => {
        const chip = document.querySelector(\`.filter-chip[data-filter="\${s}"][data-group="suite"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.tags || []).forEach(t => {
        const chip = document.querySelector(\`.filter-chip[data-filter="tag-\${t}"][data-group="tag"]\`);
        if (chip) toggleFilter(chip);
      });
      ['org', 'team', 'app'].forEach(dim => {
        (f[dim] || []).forEach(val => {
          const chip = document.querySelector(\`.filter-chip[data-filter="\${dim}-\${val}"][data-group="context-project"]\`);
          if (chip) toggleFilter(chip);
        });
      });
      (f.playwrightProject || []).forEach(p => {
        const chip = document.querySelector(\`.filter-chip[data-filter="pwproject-\${p}"][data-group="context-build"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.browsers || []).forEach(b => {
        const chip = document.querySelector(\`.filter-chip[data-filter="browser-\${b}"][data-group="context-build"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.branches || []).forEach(b => {
        const chip = document.querySelector(\`.filter-chip[data-filter="branch-\${b}"][data-group="context-build"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.envs || []).forEach(e => {
        const chip = document.querySelector(\`.filter-chip[data-filter="env-\${e}"][data-group="context-build"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.releases || []).forEach(r => {
        const chip = document.querySelector(\`.filter-chip[data-filter="release-\${r}"][data-group="context-build"]\`);
        if (chip) toggleFilter(chip);
      });
      (f.custom || []).forEach(chipFilter => {
        const chip = document.querySelector(\`.filter-chip[data-filter="\${chipFilter}"][data-group="context-custom"]\`);
        if (chip) toggleFilter(chip);
      });
    }

    function applySavedView(id) {
      const view = loadSavedViews().find(v => v.id === id);
      if (!view) return;
      applyFilterState(view.filters);
      document.querySelectorAll('.sv-item').forEach(item => {
        item.classList.toggle('sv-item-active', item.dataset.id === id);
      });
    }

    function showSaveViewForm() {
      const form = document.getElementById('sv-save-form');
      const toggle = document.getElementById('sv-save-toggle');
      const input = document.getElementById('sv-name-input');
      if (form) form.style.display = 'block';
      if (toggle) toggle.style.display = 'none';
      if (input) input.focus();
    }

    function hideSaveViewForm() {
      const form = document.getElementById('sv-save-form');
      const toggle = document.getElementById('sv-save-toggle');
      const input = document.getElementById('sv-name-input');
      if (form) form.style.display = 'none';
      if (toggle) toggle.style.display = 'block';
      if (input) input.value = '';
    }

    function saveCurrentView() {
      const nameInput = document.getElementById('sv-name-input');
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      const view = {
        id: 'view-' + Date.now(),
        name,
        filters: captureCurrentFilterState(),
        createdAt: new Date().toISOString(),
      };
      const views = getPersonalViews();
      views.push(view);
      try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)); } catch { /* ignore */ }
      hideSaveViewForm();
      renderSavedViews();
    }

    function deleteSavedView(id) {
      const preSeeded = reportMetadata.savedViews || [];
      if (preSeeded.some(v => v.id === id)) {
        const deleted = getDeletedViewIds();
        deleted.add(id);
        try { localStorage.setItem(DELETED_VIEWS_KEY, JSON.stringify([...deleted])); } catch { /* ignore */ }
      } else {
        const views = getPersonalViews().filter(v => v.id !== id);
        try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)); } catch { /* ignore */ }
      }
      renderSavedViews();
    }

    function exportSavedViews() {
      const blob = new Blob([JSON.stringify(loadSavedViews(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smart-reporter-views.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    function importSavedViews(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const imported = JSON.parse(e.target.result);
          if (!Array.isArray(imported)) return;
          const existing = getPersonalViews();
          const existingIds = new Set(existing.map(v => v.id));
          const merged = [...existing, ...imported.filter(v => v.id && !existingIds.has(v.id))];
          localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(merged));
          renderSavedViews();
        } catch { /* ignore bad JSON */ }
      };
      reader.readAsText(file);
      input.value = '';
    }

    /* ============================================
       SR-HISTORY-PLAN PHASE 1: TREND CHART FILTERING
       Dims/shows SVG bar groups by branch or env when
       the corresponding BUILD filter chips are active.
    ============================================ */

    function filterTrendBars() {
      const buildFilters = [...activeFilters['context-build']];
      const branchFilters = buildFilters
        .filter(f => f.startsWith('branch-'))
        .map(f => f.slice('branch-'.length));
      const envFilters = buildFilters
        .filter(f => f.startsWith('env-'))
        .map(f => f.slice('env-'.length));

      const hasBranchFilter = branchFilters.length > 0;
      const hasEnvFilter = envFilters.length > 0;

      if (!hasBranchFilter && !hasEnvFilter) {
        document.querySelectorAll('.bar-group').forEach(el => {
          (el as HTMLElement).style.opacity = '';
          (el as HTMLElement).style.pointerEvents = '';
        });
        updateTrendFilterBanner(null);
        return;
      }

      document.querySelectorAll('.bar-group').forEach(el => {
        const barBranch = (el as HTMLElement).dataset.branch ?? '';
        const barEnv = (el as HTMLElement).dataset.env ?? '';
        // Current run bar has empty data attributes — always shown
        const isCurrent = barBranch === '' && barEnv === '';
        const matchesBranch = !hasBranchFilter || isCurrent || branchFilters.includes(barBranch);
        const matchesEnv = !hasEnvFilter || isCurrent || envFilters.includes(barEnv);
        if (matchesBranch && matchesEnv) {
          (el as HTMLElement).style.opacity = '';
          (el as HTMLElement).style.pointerEvents = '';
        } else {
          (el as HTMLElement).style.opacity = '0.12';
          (el as HTMLElement).style.pointerEvents = 'none';
        }
      });

      const parts: string[] = [];
      if (hasBranchFilter) parts.push(\`branch: \${branchFilters.join(', ')}\`);
      if (hasEnvFilter) parts.push(\`env: \${envFilters.join(', ')}\`);
      updateTrendFilterBanner(parts.join(' · '));
    }

    function updateTrendFilterBanner(text: string | null) {
      let banner = document.getElementById('trend-filter-banner');
      if (!banner) {
        const trendSection = document.querySelector('.trend-section');
        if (!trendSection) return;
        banner = document.createElement('div');
        banner.id = 'trend-filter-banner';
        banner.className = 'trend-filter-banner';
        trendSection.insertBefore(banner, trendSection.firstChild);
      }
      if (text) {
        banner.textContent = \`Showing: \${text}\`;
        (banner as HTMLElement).style.display = 'block';
      } else {
        (banner as HTMLElement).style.display = 'none';
      }
    }

    /* ============================================
       PHASE 5: HISTORY METADATA — comparison quick-selectors
    ============================================ */

    function renderComparisonQuickSelectors() {
      const container = document.getElementById('comparison-quick-selectors');
      if (!container) return;
      const { branches, envs } = getHistoryDimensions();
      if (branches.length === 0 && envs.length === 0) { container.innerHTML = ''; return; }

      let html = '<div class="comparison-qs-bar">';
      if (branches.length > 1) {
        html += '<div class="comparison-qs-group"><span class="comparison-qs-label">Branches</span>';
        branches.forEach(b => {
          const s = findLatestSummaryFor('branch', b);
          const rate = s ? s.passRate + '% pass' : '—';
          const date = s ? new Date(s.timestamp).toLocaleDateString() : '';
          html += \`<div class="comparison-qs-card"><div class="comparison-qs-name">\${escapeHtmlUnsafe(b)}</div><div class="comparison-qs-meta">\${rate}\${date ? ' · ' + date : ''}</div></div>\`;
        });
        html += '</div>';
      }
      if (envs.length > 1) {
        html += '<div class="comparison-qs-group"><span class="comparison-qs-label">Environments</span>';
        envs.forEach(e => {
          const s = findLatestSummaryFor('env', e);
          const rate = s ? s.passRate + '% pass' : '—';
          const date = s ? new Date(s.timestamp).toLocaleDateString() : '';
          html += \`<div class="comparison-qs-card"><div class="comparison-qs-name">\${escapeHtmlUnsafe(e)}</div><div class="comparison-qs-meta">\${rate}\${date ? ' · ' + date : ''}</div></div>\`;
        });
        html += '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }

    // Extract unique branch / environment values from history summaries for quick-compare
    function getHistoryDimensions() {
      const branches = new Set();
      const envs = new Set();
      if (stats && stats.summaries) {
        stats.summaries.forEach(s => {
          if (s.metadata && s.metadata.build) {
            if (s.metadata.build.branch) branches.add(s.metadata.build.branch);
            if (s.metadata.build.environment) envs.add(s.metadata.build.environment);
          }
        });
      }
      return { branches: [...branches], envs: [...envs] };
    }

    // Find the most recent summary matching a given dimension value
    function findLatestSummaryFor(dim, value) {
      if (!stats || !stats.summaries) return null;
      const matches = stats.summaries.filter(s => {
        const build = s.metadata && s.metadata.build;
        if (!build) return false;
        return dim === 'branch' ? build.branch === value : build.environment === value;
      });
      return matches.length > 0 ? matches[matches.length - 1] : null;
    }

    /* ============================================
       PHASE 6: EXTENDED SEARCH
    ============================================ */

    function handleSearchInput(query) {
      const resultsContainer = document.getElementById('search-modal-results');
      if (!query.trim()) {
        resultsContainer.innerHTML = '';
        return;
      }

      const lowerQuery = query.toLowerCase();

      // Search tests: title, file, error text, custom metadata, build metadata values
      const testMatches = tests.filter(t => {
        if (t.title.toLowerCase().includes(lowerQuery)) return true;
        if (t.file.toLowerCase().includes(lowerQuery)) return true;
        // Phase 6: error text (first non-stack-trace line)
        if (t.error) {
          const firstLine = t.error.split('\\n')[0].toLowerCase();
          if (firstLine.includes(lowerQuery)) return true;
        }
        // Phase 6: custom metadata values
        if (t.customMetadata) {
          for (const val of Object.values(t.customMetadata)) {
            if (String(val).toLowerCase().includes(lowerQuery)) return true;
          }
        }
        return false;
      }).slice(0, 10);

      // Phase 6: search build metadata values (branch, env, release, PR, commit)
      const buildMeta = reportMetadata.build || {};
      const buildValues = [buildMeta.branch, buildMeta.environment, buildMeta.releaseVersion, buildMeta.prNumber, buildMeta.commitSha]
        .filter(Boolean).map(v => v.toLowerCase());
      const buildMatch = buildValues.some(v => v.includes(lowerQuery));

      // Phase 6: search history summaries for run-level matches
      const runMatches = [];
      if (stats && stats.summaries) {
        stats.summaries.slice().reverse().filter(s => {
          const b = s.metadata && s.metadata.build;
          if (!b) return false;
          return [b.branch, b.environment, b.prNumber, b.releaseVersion, b.commitSha]
            .filter(Boolean).some(v => v.toLowerCase().includes(lowerQuery));
        }).slice(0, 5).forEach(s => runMatches.push(s));
      }

      // Render grouped results
      let html = '';

      if (testMatches.length > 0) {
        html += \`<div class="search-result-group-label">Tests</div>\`;
        html += testMatches.map(t => {
          const statusClass = t.status === 'passed' ? 'passed' : t.status === 'skipped' ? 'skipped' : 'failed';
          const testId = String(t.testId || '').replace(/[^a-zA-Z0-9]/g, '_');
          const errorSnippet = t.error ? \`<div class="search-result-error">\${escapeHtmlUnsafe(t.error.split('\\n')[0].slice(0, 80))}</div>\` : '';
          return \`
            <div class="search-result-item" onclick="selectSearchResult('\${testId}')">
              <div class="status-dot \${statusClass}"></div>
              <div class="search-result-info">
                <div class="search-result-title">\${escapeHtmlUnsafe(t.title)}</div>
                <div class="search-result-file">\${escapeHtmlUnsafe(t.file)}</div>
                \${errorSnippet}
              </div>
            </div>
          \`;
        }).join('');
      }

      if (runMatches.length > 0) {
        html += \`<div class="search-result-group-label">Runs</div>\`;
        html += runMatches.map(s => {
          const b = s.metadata && s.metadata.build || {};
          const label = [b.branch, b.environment, b.commitSha].filter(Boolean).join(' · ');
          const ts = new Date(s.timestamp);
          const date = ts.toLocaleDateString() + ' ' + ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return \`
            <div class="search-result-item search-result-run" role="option" tabindex="0"
              onclick="closeSearch(); switchView('trends');"
              onkeydown="if(event.key==='Enter'||event.key===' '){closeSearch();switchView('trends');}">
              <div class="search-result-run-icon">⚡</div>
              <div class="search-result-info">
                <div class="search-result-title">\${escapeHtmlUnsafe(label || s.runId)}</div>
                <div class="search-result-file">\${s.passRate}% pass · \${s.total} tests · \${date}</div>
              </div>
            </div>
          \`;
        }).join('');
      }

      if (!html && buildMatch) {
        html = \`<div class="search-result-item search-result-run">
          <div class="search-result-run-icon">⚡</div>
          <div class="search-result-info">
            <div class="search-result-title">Current run matches "\${escapeHtmlUnsafe(query)}"</div>
            <div class="search-result-file">\${escapeHtmlUnsafe([buildMeta.branch, buildMeta.environment].filter(Boolean).join(' · '))}</div>
          </div>
        </div>\`;
      }

      if (!html) {
        html = '<div class="sv-empty" style="padding:1rem">No results for "' + escapeHtmlUnsafe(query) + '"</div>';
      }

      resultsContainer.innerHTML = html;
    }

    // Init saved views on load
    window.addEventListener('DOMContentLoaded', () => { renderSavedViews(); }, { once: false });
    // Ensure it runs even if DOMContentLoaded already fired
    if (document.readyState !== 'loading') { renderSavedViews(); }
`;
}
