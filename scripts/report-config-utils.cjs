const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const REPORT_CONFIG_ALIASES = {
  'coffee-cart': {
    configPath: path.join(ROOT_DIR, 'report-configs', 'coffee-cart.json'),
    reportPath: path.join(ROOT_DIR, 'playwright-report', 'smart-report-coffee-cart.html'),
  },
  'sauce-demo': {
    configPath: path.join(ROOT_DIR, 'report-configs', 'sauce-demo.json'),
    reportPath: path.join(ROOT_DIR, 'playwright-report', 'smart-report-sauce-demo.html'),
  },
  'all-apps': {
    configPath: path.join(ROOT_DIR, 'report-configs', 'all-apps.json'),
    reportPath: path.join(ROOT_DIR, 'playwright-report', 'smart-report-all-apps.html'),
  },
};

function resolveReportConfigPath(configArg) {
  if (!configArg) {
    return null;
  }

  const preset = REPORT_CONFIG_ALIASES[configArg];
  if (preset) {
    return preset.configPath;
  }

  return path.resolve(ROOT_DIR, configArg);
}

function resolveSmartReportPath(reportArg) {
  if (!reportArg) {
    return path.join(ROOT_DIR, 'playwright-report', 'smart-report.html');
  }

  const preset = REPORT_CONFIG_ALIASES[reportArg];
  if (preset) {
    return preset.reportPath;
  }

  return path.resolve(ROOT_DIR, reportArg);
}

module.exports = {
  ROOT_DIR,
  REPORT_CONFIG_ALIASES,
  resolveReportConfigPath,
  resolveSmartReportPath,
};
