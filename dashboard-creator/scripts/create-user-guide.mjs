import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, NumberFormat,
  ShadingType,
} from 'docx';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Helpers ──────────────────────────────────────────────────────────────────
const h1 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 320, after: 120 },
});

const h2 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 80 },
});

const body = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22 })],
  spacing: { after: 120 },
});

const bullet = (text, bold = false) => new Paragraph({
  children: [new TextRun({ text, size: 22, bold })],
  bullet: { level: 0 },
  spacing: { after: 80 },
});

const numbered = (text, bold = false) => new Paragraph({
  children: [new TextRun({ text, size: 22, bold })],
  numbering: { reference: 'default-numbering', level: 0 },
  spacing: { after: 100 },
});

const code = (text) => new Paragraph({
  children: [new TextRun({
    text,
    font: 'Courier New',
    size: 20,
    shading: { type: ShadingType.SOLID, fill: 'EEEEEE' },
  })],
  spacing: { after: 80 },
  indent: { left: 400 },
});

const spacer = () => new Paragraph({ text: '', spacing: { after: 120 } });

// ── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: 'default-numbering',
      levels: [{
        level: 0,
        format: NumberFormat.DECIMAL,
        text: '%1.',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 400, hanging: 260 } } },
      }],
    }],
  },
  sections: [{
    children: [

      // ── Title ──
      new Paragraph({
        children: [new TextRun({
          text: 'LinkedIn Dashboard Generator',
          bold: true,
          size: 52,
          color: '0F172A',
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'User Guide — How to create & export a dashboard image',
          size: 24,
          color: '475569',
          italics: true,
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      // ── Section 1: Overview ──
      h1('Overview'),
      body('This app generates professional dark-themed sales dashboard images (1200×628px) optimised for LinkedIn posts. You update an Excel file with your data, upload it to the app, pick a theme, and download a PNG — all in under 2 minutes.'),

      spacer(),

      // ── Section 2: Standard SOP ──
      h1('Standard Workflow (Every Session)'),

      h2('Step 1 — Update your data'),
      body('Open the file:'),
      code('/Users/ryancarlin/Dashboard Creator/public/sample-data.xlsx'),
      body('Edit numbers in any of the 5 sheets, then save and close Excel.'),

      h2('Step 2 — Start the app'),
      body('Open Terminal (Cmd + Space → type "Terminal" → Enter) and run:'),
      code('cd "/Users/ryancarlin/Dashboard Creator"'),
      code('/opt/homebrew/bin/npm run dev'),
      body('Then open your browser and go to:'),
      code('http://localhost:5173'),
      body('Leave Terminal open in the background while you use the app.'),

      h2('Step 3 — Upload your Excel file'),
      body('In the browser, drag your sample-data.xlsx file onto the "or drag & drop here" zone, or click "Upload Excel" and select the file. The dashboard re-renders immediately.'),

      h2('Step 4 — Pick a theme'),
      body('Use the Theme dropdown in the top bar to switch between the 6 dark themes:'),
      bullet('Midnight — dark navy with cyan accent (default)'),
      bullet('Charcoal — dark grey with amber accent'),
      bullet('Navy — deep blue with blue accent'),
      bullet('Obsidian — true black with purple accent'),
      bullet('Forest — dark green with green accent'),
      bullet('Slate — slate blue with rose accent'),

      h2('Step 5 — Export the PNG'),
      body('Click the "Export PNG" button (top right). The file downloads automatically as:'),
      code('linkedin-dashboard.png'),
      body('It is 1200×628px at 2× resolution — the optimal size for LinkedIn posts.'),

      h2('Step 6 — Stop the app'),
      body('Go back to Terminal and press Cmd + C to stop the dev server.'),

      spacer(),

      // ── Section 3: Excel sheets ──
      h1('Excel File Structure'),
      body('The file public/sample-data.xlsx contains 5 sheets:'),

      bullet('funnel_data — stage, value, percentage, color'),
      bullet('line_chart_data — month, won_amount, forecast, threshold'),
      bullet('pie_chart_data — category, value, color'),
      bullet('forecast_table — period, pipeline, expected, confidence'),
      bullet('theme_config — key/value pairs to override theme colors'),

      spacer(),
      body('Tips for line_chart_data:'),
      bullet('Leave forecast blank for historical months (won_amount is filled)'),
      bullet('Leave won_amount blank for future months (forecast is filled)'),
      bullet('threshold is the same value in every row (e.g. 900000)'),

      spacer(),
      body('Tips for forecast_table:'),
      bullet('confidence is a number 0–100 (the bar auto-colors: green ≥70%, yellow 40–69%, red <40%)'),

      spacer(),

      // ── Section 4: Theme override from Excel ──
      h1('Overriding Theme Colors from Excel'),
      body('In the theme_config sheet, fill in the "value" column for any key to override the selected theme\'s colors. Leave blank to use the dropdown theme. Available keys:'),

      bullet('bg_primary — main background'),
      bullet('bg_card — card/module background'),
      bullet('accent_1 — primary accent color'),
      bullet('accent_2 — secondary accent color'),
      bullet('text_primary — main text'),
      bullet('text_secondary — muted text'),
      bullet('border_color — card borders'),
      bullet('gradient_start / gradient_end — branding gradient'),
      bullet('chart_line / chart_dot — line chart color'),
      bullet('threshold_color — target line color'),
      bullet('kpi_bg — KPI card background'),

      spacer(),

      // ── Section 5: File locations ──
      h1('Key File Locations'),
      bullet('App folder:  /Users/ryancarlin/Dashboard Creator/'),
      bullet('Excel template:  public/sample-data.xlsx'),
      bullet('Exported PNG:  your Downloads folder'),
      bullet('Source code:  src/ folder'),

      spacer(),

      // ── Section 6: Troubleshooting ──
      h1('Troubleshooting'),

      h2('"npm: command not found"'),
      body('Always use the full path:'),
      code('/opt/homebrew/bin/npm run dev'),

      h2('Dashboard shows old data after upload'),
      body('Make sure you saved the Excel file before dragging it in. Try uploading again.'),

      h2('Export PNG button does nothing'),
      body('Check that your browser allows downloads. Try a different browser (Chrome recommended).'),

      h2('Charts look cut off'),
      body('The dashboard is exactly 1200px wide. If it looks clipped in the browser, that is just the browser zoom — the exported PNG will be correct.'),

      spacer(),

      // ── Footer ──
      new Paragraph({
        children: [new TextRun({
          text: 'Generated by Claude Code · Dashboard Creator v1.0',
          size: 18,
          color: '94A3B8',
          italics: true,
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ],
  }],
});

const outputPath = join(__dirname, '..', 'Dashboard Generator — User Guide.docx');
const buffer = await Packer.toBuffer(doc);
writeFileSync(outputPath, buffer);
console.log(`✓ Created: ${outputPath}`);
