import * as XLSX from 'xlsx';

export const SAMPLE_DATA = {
  funnelData: [
    { stage: 'Aware', value: 7310000, percentage: 100, color: null },
    { stage: 'Consider', value: 5480000, percentage: 74.9, color: null },
    { stage: 'Interest', value: 3620000, percentage: 49.5, color: null },
    { stage: 'Decision', value: 2140000, percentage: 29.3, color: null },
    { stage: 'Negotiation', value: 1280000, percentage: 17.5, color: null },
    { stage: 'Proposal', value: 680000, percentage: 9.3, color: null },
  ],
  lineChartData: [
    { month: 'Jan', won_amount: 230000, forecast: null, threshold: 900000 },
    { month: 'Feb', won_amount: 310000, forecast: null, threshold: 900000 },
    { month: 'Mar', won_amount: 480000, forecast: null, threshold: 900000 },
    { month: 'Apr', won_amount: 420000, forecast: null, threshold: 900000 },
    { month: 'May', won_amount: 590000, forecast: null, threshold: 900000 },
    { month: 'Jun', won_amount: 710000, forecast: null, threshold: 900000 },
    { month: 'Jul', won_amount: 680000, forecast: null, threshold: 900000 },
    { month: 'Aug', won_amount: 820000, forecast: null, threshold: 900000 },
    { month: 'Sep', won_amount: null, forecast: 870000, threshold: 900000 },
    { month: 'Oct', won_amount: null, forecast: 960000, threshold: 900000 },
    { month: 'Nov', won_amount: null, forecast: 1050000, threshold: 900000 },
    { month: 'Dec', won_amount: null, forecast: 1180000, threshold: 900000 },
  ],
  pieChartData: [
    { category: 'Inbound', value: 45, color: null },
    { category: 'Outbound', value: 28, color: null },
    { category: 'Referral', value: 15, color: null },
    { category: 'Partner', value: 8, color: null },
    { category: 'Event', value: 4, color: null },
  ],
  forecastTable: [
    { period: 'Q1 2025', pipeline: 2400000, expected: 1200000, confidence: 72 },
    { period: 'Q2 2025', pipeline: 3100000, expected: 1550000, confidence: 58 },
    { period: 'Q3 2025', pipeline: 2800000, expected: 1120000, confidence: 40 },
    { period: 'Q4 2025', pipeline: 4200000, expected: 1470000, confidence: 35 },
  ],
  themeConfig: {},
};

function parseNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseSheet(wb, sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return null;
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        // Parse funnel_data
        const rawFunnel = parseSheet(wb, 'funnel_data') || [];
        const funnelData = rawFunnel.map((row) => ({
          stage: String(row.stage || ''),
          value: parseNumber(row.value),
          percentage: parseNumber(row.percentage),
          color: row.color ? String(row.color) : null,
        })).filter((r) => r.stage);

        // Parse line_chart_data
        const rawLine = parseSheet(wb, 'line_chart_data') || [];
        const lineChartData = rawLine.map((row) => ({
          month: String(row.month || ''),
          won_amount: parseNumber(row.won_amount),
          forecast: parseNumber(row.forecast),
          threshold: parseNumber(row.threshold),
        })).filter((r) => r.month);

        // Parse pie_chart_data
        const rawPie = parseSheet(wb, 'pie_chart_data') || [];
        const pieChartData = rawPie.map((row) => ({
          category: String(row.category || ''),
          value: parseNumber(row.value),
          color: row.color ? String(row.color) : null,
        })).filter((r) => r.category);

        // Parse forecast_table
        const rawForecast = parseSheet(wb, 'forecast_table') || [];
        const forecastTable = rawForecast.map((row) => ({
          period: String(row.period || ''),
          pipeline: parseNumber(row.pipeline),
          expected: parseNumber(row.expected),
          confidence: parseNumber(row.confidence),
        })).filter((r) => r.period);

        // Parse theme_config (key-value pairs)
        const rawTheme = parseSheet(wb, 'theme_config') || [];
        const themeConfig = {};
        rawTheme.forEach((row) => {
          if (row.key && row.value !== null && String(row.value).trim() !== '') {
            themeConfig[row.key] = String(row.value).trim();
          }
        });

        resolve({
          funnelData: funnelData.length ? funnelData : SAMPLE_DATA.funnelData,
          lineChartData: lineChartData.length ? lineChartData : SAMPLE_DATA.lineChartData,
          pieChartData: pieChartData.length ? pieChartData : SAMPLE_DATA.pieChartData,
          forecastTable: forecastTable.length ? forecastTable : SAMPLE_DATA.forecastTable,
          themeConfig,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function applyThemeConfig(baseTheme, themeConfig) {
  if (!themeConfig || Object.keys(themeConfig).length === 0) return baseTheme;

  const keyMap = {
    bg_primary: 'bgPrimary',
    bg_card: 'bgCard',
    accent_1: 'accent1',
    accent_2: 'accent2',
    text_primary: 'textPrimary',
    text_secondary: 'textSecondary',
    font_family: 'fontFamily',
    border_color: 'borderColor',
    gradient_start: 'gradientStart',
    gradient_end: 'gradientEnd',
    chart_line: 'chartLine',
    chart_dot: 'chartDot',
    threshold_color: 'thresholdColor',
    kpi_bg: 'kpiBg',
  };

  const merged = { ...baseTheme };
  Object.entries(themeConfig).forEach(([k, v]) => {
    const mapped = keyMap[k];
    if (mapped) merged[mapped] = v;
  });
  return merged;
}
