/**
 * Embedded Trace Viewer Generator
 * Builds a comprehensive trace viewer that matches Playwright's native viewer
 * Features: Timeline, Before/After snapshots, Console, Source, Network waterfall, Metadata
 */

import { JSZIP_SOURCE } from '../../vendors/jszip-source';

/**
 * Generate the inlined JSZip script
 * This must be included before generateTraceViewerScript() in the HTML
 */
export function generateJSZipScript(): string {
  return `
    // JSZip v3.10.1 - inlined for self-contained reports
    ${JSZIP_SOURCE}
  `;
}
