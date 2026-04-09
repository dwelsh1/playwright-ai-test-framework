import * as fs from 'fs';
import * as path from 'path';
import type {
  ReportMetadata,
  ProjectMetadata,
  BuildMetadata,
  CustomMetadataField,
  SavedView,
} from '../types';

export interface MetadataCollectorResult {
  reportMetadata: ReportMetadata;
  customFields: CustomMetadataField[];
  savedViews: SavedView[];
  outputFile?: string;
}

/**
 * Reads project & build metadata from playwright-report-settings.json and environment variables.
 * Static project identity comes from config; build-time data (branch, SHA, PR) comes from env vars.
 */
export class MetadataCollector {
  private configPath: string;

  constructor(rootDir: string) {
    // SMART_REPORTER_CONFIG env var: set by scripts/test-smart.cjs so concurrent runs each
    // read their own config file directly, bypassing the shared playwright-report-settings.json.
    const envConfig = process.env['SMART_REPORTER_CONFIG'];
    if (envConfig) {
      const resolved = path.isAbsolute(envConfig)
        ? envConfig
        : path.resolve(process.cwd(), envConfig);
      if (fs.existsSync(resolved)) {
        this.configPath = resolved;
        return;
      }
    }

    // Prefer process.cwd() (repo root where the command is run) over rootDir,
    // which can resolve to testDir rather than the project root depending on how
    // the reporter is invoked (e.g. --reporter= CLI flag vs playwright.config.ts).
    const candidates = [process.cwd(), rootDir];
    const found = candidates.find((dir) =>
      fs.existsSync(path.resolve(dir, 'playwright-report-settings.json')),
    );
    this.configPath = path.resolve(found ?? process.cwd(), 'playwright-report-settings.json');
  }

  collect(options?: {
    project?: ProjectMetadata;
    customFields?: CustomMetadataField[];
    savedViews?: SavedView[];
  }): MetadataCollectorResult {
    // Read config file
    let fileConfig: Record<string, unknown> = {};
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        fileConfig = JSON.parse(content) as Record<string, unknown>;
      }
    } catch {
      // Config file is optional — continue without it
    }

    const fileMetadata = (fileConfig.metadata as Record<string, unknown>) || {};
    const fileProject = (fileMetadata.project as ProjectMetadata) || {};
    const fileBuild = (fileMetadata.build as BuildMetadata) || {};

    // Project metadata: programmatic options override config file
    const projectMetadata: ProjectMetadata = {
      org: options?.project?.org ?? fileProject.org,
      team: options?.project?.team ?? fileProject.team,
      // Q1: fall back chain → omit if nothing set
      app: options?.project?.app ?? fileProject.app ?? undefined,
      repo: options?.project?.repo ?? fileProject.repo,
      region: options?.project?.region ?? fileProject.region,
    };

    // Remove keys with undefined values for a clean object
    (Object.keys(projectMetadata) as (keyof ProjectMetadata)[]).forEach((k) => {
      if (projectMetadata[k] === undefined) delete projectMetadata[k];
    });

    const buildMetadata = this.collectBuildMetadata(fileBuild);

    const reportMetadata: ReportMetadata = {
      project: projectMetadata,
      build: buildMetadata,
    };

    // Custom fields: config file first, options override/append
    const fileCustomFields = (fileMetadata.customFields as CustomMetadataField[]) || [];
    const customFields: CustomMetadataField[] = [
      ...fileCustomFields,
      ...(options?.customFields || []),
    ];

    // Saved views: config file first, options append
    const fileSavedViews = (fileConfig.savedViews as SavedView[]) || [];
    const savedViews: SavedView[] = [...fileSavedViews, ...(options?.savedViews || [])];

    const outputFile =
      typeof fileConfig.outputFile === 'string' && fileConfig.outputFile.trim() !== ''
        ? fileConfig.outputFile.trim()
        : undefined;
    return { reportMetadata, customFields, savedViews, outputFile };
  }

  private collectBuildMetadata(fileBuild: BuildMetadata = {}): BuildMetadata {
    const env = process.env;
    const build: BuildMetadata = {};

    if (env.GITHUB_ACTIONS) {
      build.ciProvider = 'github';
      // Config file values take priority — lets local testing override CI env vars.
      // Falls back to CI env vars when config file has no value (normal CI runs).
      build.branch =
        fileBuild.branch ||
        env.GITHUB_HEAD_REF ||
        env.GITHUB_REF_NAME ||
        env.GITHUB_REF?.replace('refs/heads/', '');
      build.commitSha = fileBuild.commitSha || env.GITHUB_SHA?.slice(0, 8);
      build.commitMessage = fileBuild.commitMessage || env.GITHUB_COMMIT_MESSAGE;
      build.prNumber = fileBuild.prNumber || env.GITHUB_PR_NUMBER;
      build.pipelineId = fileBuild.pipelineId || env.GITHUB_RUN_ID;
      build.releaseVersion =
        fileBuild.releaseVersion ||
        (env.GITHUB_REF?.startsWith('refs/tags/')
          ? env.RELEASE_VERSION || env.GITHUB_REF_NAME
          : undefined);
    } else if (env.CIRCLECI) {
      build.ciProvider = 'circleci';
      build.branch = fileBuild.branch || env.CIRCLE_BRANCH;
      build.commitSha = fileBuild.commitSha || env.CIRCLE_SHA1?.slice(0, 8);
      build.commitMessage = fileBuild.commitMessage || env.COMMIT_MESSAGE;
      build.prNumber = fileBuild.prNumber || env.CIRCLE_PR_NUMBER;
      build.pipelineId = fileBuild.pipelineId || env.CIRCLE_WORKFLOW_ID;
      build.releaseVersion = fileBuild.releaseVersion || env.CIRCLE_TAG || env.RELEASE_VERSION;
    } else {
      // Generic env vars → fall back to config file values for local runs
      build.ciProvider = fileBuild.ciProvider || 'local';
      build.branch = fileBuild.branch || env.BRANCH_NAME;
      build.commitSha = fileBuild.commitSha || env.COMMIT_SHA?.slice(0, 8);
      build.commitMessage = fileBuild.commitMessage || env.COMMIT_MESSAGE;
      build.prNumber = fileBuild.prNumber || env.PR_NUMBER;
      build.pipelineId = fileBuild.pipelineId || env.PIPELINE_ID;
      build.releaseVersion = fileBuild.releaseVersion || env.RELEASE_VERSION;
    }

    // Q3: environment only when TEST_ENV is set or config file specifies it
    if (env.TEST_ENV) {
      build.environment = env.TEST_ENV;
    } else if (fileBuild.environment) {
      build.environment = fileBuild.environment;
    }

    // Strip undefined/empty values for a clean object
    (Object.keys(build) as (keyof BuildMetadata)[]).forEach((k) => {
      if (!build[k]) delete build[k];
    });

    return build;
  }
}
