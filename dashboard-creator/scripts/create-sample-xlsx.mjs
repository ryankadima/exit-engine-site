import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const wb = XLSX.utils.book_new();

// ── Sheet 1: funnel_data ────────────────────────────────────────────────────
const funnelData = [
  { stage: 'Aware',        value: 7310000, percentage: 100,  color: '' },
  { stage: 'Consider',     value: 5480000, percentage: 74.9, color: '' },
  { stage: 'Interest',     value: 3620000, percentage: 49.5, color: '' },
  { stage: 'Decision',     value: 2140000, percentage: 29.3, color: '' },
  { stage: 'Negotiation',  value: 1280000, percentage: 17.5, color: '' },
  { stage: 'Proposal',     value:  680000, percentage:  9.3, color: '' },
];
const ws1 = XLSX.utils.json_to_sheet(funnelData);
XLSX.utils.book_append_sheet(wb, ws1, 'funnel_data');

// ── Sheet 2: line_chart_data ────────────────────────────────────────────────
const lineData = [
  { month: 'Jan', won_amount: 230000, forecast: '',      threshold: 900000 },
  { month: 'Feb', won_amount: 310000, forecast: '',      threshold: 900000 },
  { month: 'Mar', won_amount: 480000, forecast: '',      threshold: 900000 },
  { month: 'Apr', won_amount: 420000, forecast: '',      threshold: 900000 },
  { month: 'May', won_amount: 590000, forecast: '',      threshold: 900000 },
  { month: 'Jun', won_amount: 710000, forecast: '',      threshold: 900000 },
  { month: 'Jul', won_amount: 680000, forecast: '',      threshold: 900000 },
  { month: 'Aug', won_amount: 820000, forecast: '',      threshold: 900000 },
  { month: 'Sep', won_amount: '',     forecast:  870000, threshold: 900000 },
  { month: 'Oct', won_amount: '',     forecast:  960000, threshold: 900000 },
  { month: 'Nov', won_amount: '',     forecast: 1050000, threshold: 900000 },
  { month: 'Dec', won_amount: '',     forecast: 1180000, threshold: 900000 },
];
const ws2 = XLSX.utils.json_to_sheet(lineData);
XLSX.utils.book_append_sheet(wb, ws2, 'line_chart_data');

// ── Sheet 3: pie_chart_data ─────────────────────────────────────────────────
const pieData = [
  { category: 'Inbound',  value: 45, color: '' },
  { category: 'Outbound', value: 28, color: '' },
  { category: 'Referral', value: 15, color: '' },
  { category: 'Partner',  value:  8, color: '' },
  { category: 'Event',    value:  4, color: '' },
];
const ws3 = XLSX.utils.json_to_sheet(pieData);
XLSX.utils.book_append_sheet(wb, ws3, 'pie_chart_data');

// ── Sheet 4: forecast_table ─────────────────────────────────────────────────
const forecastData = [
  { period: 'Q1 2025', pipeline: 2400000, expected: 1200000, confidence: 72 },
  { period: 'Q2 2025', pipeline: 3100000, expected: 1550000, confidence: 58 },
  { period: 'Q3 2025', pipeline: 2800000, expected: 1120000, confidence: 40 },
  { period: 'Q4 2025', pipeline: 4200000, expected: 1470000, confidence: 35 },
];
const ws4 = XLSX.utils.json_to_sheet(forecastData);
XLSX.utils.book_append_sheet(wb, ws4, 'forecast_table');

// ── Sheet 5: theme_config ───────────────────────────────────────────────────
// Leave values blank — app uses selected dropdown theme by default.
// Fill these in to override the theme from the spreadsheet.
const themeConfig = [
  { key: 'bg_primary',       value: '', description: 'Main background color (e.g. #0F172A)' },
  { key: 'bg_card',          value: '', description: 'Card/module background' },
  { key: 'accent_1',         value: '', description: 'Primary accent color' },
  { key: 'accent_2',         value: '', description: 'Secondary accent color' },
  { key: 'text_primary',     value: '', description: 'Primary text color' },
  { key: 'text_secondary',   value: '', description: 'Muted/secondary text color' },
  { key: 'border_color',     value: '', description: 'Card border color' },
  { key: 'gradient_start',   value: '', description: 'Gradient start color' },
  { key: 'gradient_end',     value: '', description: 'Gradient end color' },
  { key: 'chart_line',       value: '', description: 'Line chart color' },
  { key: 'chart_dot',        value: '', description: 'Data point dot color' },
  { key: 'threshold_color',  value: '', description: 'Target/threshold line color' },
  { key: 'kpi_bg',           value: '', description: 'KPI card background' },
];
const ws5 = XLSX.utils.json_to_sheet(themeConfig);
XLSX.utils.book_append_sheet(wb, ws5, 'theme_config');

// ── Write file ──────────────────────────────────────────────────────────────
const outputPath = join(__dirname, '..', 'public', 'sample-data.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`✓ Created: ${outputPath}`);
