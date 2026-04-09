import type { TestResultData, TestRecommendation, FailureCluster, SuiteStats } from '../types';

/** Options for AI analyzer (LM Studio + cloud providers) */
export interface AIAnalyzerOptions {
  lmStudioBaseUrl?: string;
  lmStudioModel?: string;
  /** Max tokens for AI response (default 512). From app Settings or playwright-report-settings.json or env. */
  maxTokensForAI?: number;
}

const LM_STUDIO_DEFAULT_BASE = 'http://127.0.0.1:1234';
const LM_STUDIO_DEFAULT_MODEL = 'local';

/**
 * AI-powered analysis for test failures and recommendations
 * Supports LM Studio (local), Anthropic, OpenAI, and Gemini (priority: LM Studio first when configured, then Anthropic → OpenAI → Gemini).
 */
const DEFAULT_MAX_TOKENS_FOR_AI = 512;

export class AIAnalyzer {
  private anthropicKey?: string;
  private openaiKey?: string;
  private geminiKey?: string;
  private lmStudioBaseUrl?: string;
  private lmStudioModel: string;
  private maxTokensForAI: number;
  private lmStudioUnavailableLogged = false;

  constructor(options: AIAnalyzerOptions = {}) {
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.maxTokensForAI = Math.max(
      100,
      Math.min(4000, options.maxTokensForAI ?? DEFAULT_MAX_TOKENS_FOR_AI),
    );
    // Env overrides config; default base when enabled via config
    const baseUrl = process.env.LM_STUDIO_BASE_URL ?? options.lmStudioBaseUrl;
    const model = process.env.LM_STUDIO_MODEL ?? options.lmStudioModel ?? LM_STUDIO_DEFAULT_MODEL;
    if (baseUrl) {
      this.lmStudioBaseUrl = baseUrl.replace(/\/$/, '');
      this.lmStudioModel = model;
    } else {
      this.lmStudioModel = LM_STUDIO_DEFAULT_MODEL;
    }
  }

  /**
   * Add AI suggestions to failed tests (batched for performance)
   */
  async analyzeFailed(results: TestResultData[]): Promise<void> {
    const failedTests = results.filter((r) => r.status === 'failed' || r.status === 'timedOut');

    if (failedTests.length === 0) return;

    if (!this.lmStudioBaseUrl && !this.anthropicKey && !this.openaiKey && !this.geminiKey) {
      console.log(
        '💡 Tip: Set LM_STUDIO_BASE_URL (e.g. http://127.0.0.1:1234), ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY for AI failure analysis',
      );
      return;
    }

    console.log(`\n🤖 Analyzing ${failedTests.length} failure(s) with AI...`);

    // Process in batches of 3 concurrent requests for better performance
    const BATCH_SIZE = 3;
    for (let i = 0; i < failedTests.length; i += BATCH_SIZE) {
      const batch = failedTests.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(failedTests.length / BATCH_SIZE);
      console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} tests)...`);

      const promises = batch.map(async (test) => {
        try {
          const prompt = test.aiPrompt ?? this.buildFailurePrompt(test);
          const suggestion = await this.callAI(prompt);
          if (suggestion && suggestion !== 'AI analysis not available') {
            test.aiSuggestion = suggestion;
          }
        } catch (err) {
          console.error(`Failed to get AI suggestion for "${test.title}":`, err);
        }
      });

      await Promise.all(promises);
    }

    console.log(`   ✅ AI analysis complete`);
  }

  /**
   * Add AI suggestions to failure clusters
   */
  async analyzeClusters(clusters: FailureCluster[]): Promise<void> {
    if (clusters.length === 0) return;
    if (!this.lmStudioBaseUrl && !this.anthropicKey && !this.openaiKey && !this.geminiKey) return;

    console.log(`\n🤖 Analyzing ${clusters.length} failure cluster(s) with AI...`);

    for (const cluster of clusters) {
      try {
        const prompt = this.buildClusterPrompt(cluster);
        const suggestion = await this.callAI(prompt);
        if (suggestion && suggestion !== 'AI analysis not available') {
          cluster.aiSuggestion = suggestion;
        }
      } catch (err) {
        console.error(`Failed to get AI suggestion for cluster "${cluster.errorType}":`, err);
      }
    }
  }

  /**
   * Generate comprehensive test recommendations
   */
  generateRecommendations(results: TestResultData[], stats: SuiteStats): TestRecommendation[] {
    const recommendations: TestRecommendation[] = [];

    // Flakiness recommendations
    const flakyTests = results.filter((r) => r.flakinessScore && r.flakinessScore >= 0.3);
    if (flakyTests.length > 0) {
      recommendations.push({
        type: 'flakiness',
        priority: 90,
        title: 'Fix Flaky Tests',
        description: `${flakyTests.length} test(s) are showing flaky behavior (pass/fail inconsistency)`,
        action: 'Review test isolation, add proper waits, investigate race conditions',
        affectedTests: flakyTests.map((t) => t.testId),
        icon: '🔴',
      });
    }

    // Retry recommendations
    const retryTests = results.filter((r) => r.retryInfo?.needsAttention);
    if (retryTests.length > 0) {
      recommendations.push({
        type: 'retry',
        priority: 80,
        title: 'Reduce Test Retries',
        description: `${retryTests.length} test(s) frequently require retries to pass`,
        action: 'Identify root cause of instability, improve test robustness',
        affectedTests: retryTests.map((t) => t.testId),
        icon: '🔄',
      });
    }

    // Performance recommendations
    const slowTests = results.filter((r) => r.performanceTrend?.startsWith('↑'));
    if (slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 60,
        title: 'Improve Test Performance',
        description: `${slowTests.length} test(s) have gotten significantly slower`,
        action: 'Profile slow steps, optimize waits, consider test parallelization',
        affectedTests: slowTests.map((t) => t.testId),
        icon: '🐢',
      });
    }

    // Suite health recommendations
    if (stats.passRate < 90) {
      recommendations.push({
        type: 'suite',
        priority: 95,
        title: 'Improve Suite Pass Rate',
        description: `Overall pass rate is ${stats.passRate}% (target: 90%+)`,
        action: 'Focus on fixing failed tests before adding new tests',
        affectedTests: [],
        icon: '📊',
      });
    }

    if (stats.averageStability < 70) {
      recommendations.push({
        type: 'suite',
        priority: 85,
        title: 'Improve Suite Stability',
        description: `Average stability score is ${stats.averageStability}/100 (target: 70+)`,
        action: 'Address flakiness, retries, and performance issues systematically',
        affectedTests: [],
        icon: '⚠️',
      });
    }

    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Build prompt for individual test failure
   */
  private buildFailurePrompt(test: TestResultData): string {
    return `Analyze this Playwright test failure and suggest a fix. Be concise (2-3 sentences max).

Test: ${test.title}
File: ${test.file}
Error:
${test.error || 'Unknown error'}

Provide a brief, actionable suggestion to fix this failure.`;
  }

  /**
   * Build prompt for failure cluster
   */
  private buildClusterPrompt(cluster: FailureCluster): string {
    const testTitles = cluster.tests
      .slice(0, 5)
      .map((t) => t.title)
      .join('\n- ');
    const moreTests = cluster.count > 5 ? `\n... and ${cluster.count - 5} more` : '';

    return `Analyze this group of similar test failures and suggest a fix. Be concise (2-3 sentences max).

Error Type: ${cluster.errorType}
Number of Affected Tests: ${cluster.count}
Example Tests:
- ${testTitles}${moreTests}

Example Error:
${cluster.tests[0].error || 'Unknown error'}

Provide a brief, actionable suggestion to fix these failures.`;
  }

  /**
   * Call AI API (LM Studio first when configured, then Anthropic, OpenAI, or Gemini)
   */
  private async callAI(prompt: string): Promise<string> {
    const hasCloud = !!(this.anthropicKey || this.openaiKey || this.geminiKey);
    if (this.lmStudioBaseUrl) {
      try {
        return await this.callLMStudio(prompt);
      } catch (err) {
        const errMsg = (err as Error).message;
        if (hasCloud) {
          console.warn('LM Studio request failed, trying cloud provider:', errMsg);
        } else {
          if (!this.lmStudioUnavailableLogged) {
            this.lmStudioUnavailableLogged = true;
            console.warn(
              `LM Studio request failed: ${errMsg}. Check base URL (${this.lmStudioBaseUrl}), model (${this.lmStudioModel}), and that the model is loaded in LM Studio. Or set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY for AI suggestions.`,
            );
          }
          return 'AI analysis not available';
        }
      }
    }
    if (this.anthropicKey) {
      return this.callAnthropic(prompt);
    }
    if (this.openaiKey) {
      return this.callOpenAI(prompt);
    }
    if (this.geminiKey) {
      return this.callGemini(prompt);
    }
    return 'AI analysis not available';
  }

  /** Timeout for LM Studio request (ms) to avoid hanging when server is slow or unreachable */
  private static readonly LM_STUDIO_TIMEOUT_MS = 60_000;

  /**
   * Call LM Studio (OpenAI-compatible local API). No API key required.
   */
  private async callLMStudio(prompt: string): Promise<string> {
    const url = `${this.lmStudioBaseUrl}/v1/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AIAnalyzer.LM_STUDIO_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.lmStudioModel,
          max_tokens: this.maxTokensForAI,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const msg =
        (err as Error).name === 'AbortError'
          ? `Request timed out after ${AIAnalyzer.LM_STUDIO_TIMEOUT_MS / 1000}s`
          : (err as Error).message;
      throw new Error(msg);
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || 'No suggestion available';
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: this.maxTokensForAI,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    return data.content[0]?.text || 'No suggestion available';
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: this.maxTokensForAI,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content || 'No suggestion available';
  }

  /**
   * Call Gemini API
   */
  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.geminiKey!,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: this.maxTokensForAI,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> }; role: string }>;
    };
    return data.candidates[0]?.content?.parts[0]?.text || 'No suggestion available';
  }

  /**
   * Check if AI analysis is available
   */
  isAvailable(): boolean {
    return !!(this.lmStudioBaseUrl || this.anthropicKey || this.openaiKey || this.geminiKey);
  }
}
