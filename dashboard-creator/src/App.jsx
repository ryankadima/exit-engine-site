import React, { useState, useCallback, useRef, useEffect } from 'react';
import FunnelChart from './components/FunnelChart';
import TrendChart from './components/TrendChart';
import PieModule from './components/PieModule';
import ForecastTable from './components/ForecastTable';
import { THEMES, DEFAULT_THEME_KEY } from './themes';
import { SAMPLE_DATA, parseExcelFile, applyThemeConfig } from './utils/parseExcel';
import { exportDashboardPng } from './utils/exportImage';

// ── Branding watermark overlaid at bottom of dashboard ─────────────────────
function BrandingWatermark({ theme }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 900,
            color: 'white',
          }}
        >
          D
        </div>
        <span style={{ fontSize: '9px', fontWeight: 700, color: theme.accent1, letterSpacing: '0.06em', opacity: 0.7 }}>
          SALES ANALYTICS
        </span>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div
          style={{
            width: '80px',
            height: '1px',
            background: `linear-gradient(90deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
            borderRadius: '1px',
            opacity: 0.5,
          }}
        />
        <span style={{ fontSize: '8px', color: theme.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>
          {dateStr}
        </span>
      </div>
    </div>
  );
}

// ── Module Card wrapper ─────────────────────────────────────────────────────
function ModuleCard({ children, theme, style }) {
  return (
    <div
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: '10px',
        padding: '14px 16px',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* Subtle top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${theme.accent1}60, transparent)`,
        }}
      />
      {children}
    </div>
  );
}

// ── The actual dashboard (1200×1200 render target) ───────────────────────────
function Dashboard({ data, theme }) {
  const { funnelData, lineChartData, pieChartData, forecastTable } = data;

  return (
    <div
      id="dashboard-container"
      style={{
        width: '1200px',
        height: '1200px',
        background: theme.bgPrimary,
        fontFamily: theme.fontFamily,
        padding: '12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${theme.borderColor}22 1px, transparent 1px),
            linear-gradient(90deg, ${theme.borderColor}22 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Glow blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-80px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.gradientStart}14 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-60px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.gradientEnd}10 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: '6px' }}>

        {/* Compact single-line header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            height: '26px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 900,
                color: theme.textPrimary,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              Sales Performance Dashboard
            </span>
            <span style={{ fontSize: '10px', color: theme.textSecondary, fontWeight: 500 }}>
              Pipeline · Revenue · Forecast · Lead Sources
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: `${theme.accent1}18`,
              border: `1px solid ${theme.accent1}40`,
              borderRadius: '20px',
              padding: '3px 10px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: theme.accent1,
                boxShadow: `0 0 5px ${theme.accent1}`,
              }}
            />
            <span style={{ fontSize: '9px', fontWeight: 700, color: theme.accent1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Live
            </span>
          </div>
        </div>

        {/* 2×2 equal square module grid */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '8px',
            minHeight: 0,
          }}
        >
          <ModuleCard theme={theme}>
            <FunnelChart data={funnelData} theme={theme} />
          </ModuleCard>

          <ModuleCard theme={theme}>
            <TrendChart data={lineChartData} theme={theme} />
          </ModuleCard>

          <ModuleCard theme={theme}>
            <PieModule data={pieChartData} theme={theme} />
          </ModuleCard>

          <ModuleCard theme={theme}>
            <ForecastTable data={forecastTable} theme={theme} />
          </ModuleCard>
        </div>
      </div>

    </div>
  );
}

// ── App shell ───────────────────────────────────────────────────────────────
export default function App() {
  const initialTheme = (() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    return hash && THEMES[hash] ? hash : DEFAULT_THEME_KEY;
  })();
  const [themeKey, setThemeKey] = useState(initialTheme);

  useEffect(() => {
    window.location.hash = themeKey;
  }, [themeKey]);
  const [data, setData] = useState(SAMPLE_DATA);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [parseError, setParseError] = useState(null);
  const fileInputRef = useRef(null);

  const baseTheme = THEMES[themeKey];
  const theme = data.themeConfig && Object.keys(data.themeConfig).length > 0
    ? applyThemeConfig(baseTheme, data.themeConfig)
    : baseTheme;

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setParseError(null);
    try {
      const parsed = await parseExcelFile(file);
      setData(parsed);
      setFileName(file.name);
    } catch (err) {
      setParseError(`Failed to parse file: ${err.message}`);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await exportDashboardPng('dashboard-container', 'linkedin-dashboard.png');
    } catch (err) {
      setExportError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Control bar ── */}
      <div
        className="no-export"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Theme selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Theme
          </label>
          <select
            value={themeKey}
            onChange={(e) => setThemeKey(e.target.value)}
            style={{
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {Object.entries(THEMES).map(([key, t]) => (
              <option key={key} value={key}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Upload button */}
        <div style={{ position: 'relative' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#1E293B',
              color: '#94A3B8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⬆</span>
            {fileName ? fileName : 'Upload Excel'}
          </button>
        </div>

        {/* Drop zone hint */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            padding: '6px 14px',
            border: `1px dashed ${isDragging ? '#06B6D4' : '#334155'}`,
            borderRadius: '6px',
            fontSize: '12px',
            color: isDragging ? '#06B6D4' : '#475569',
            background: isDragging ? 'rgba(6,182,212,0.06)' : 'transparent',
            cursor: 'default',
            transition: 'all 0.15s',
          }}
        >
          {isDragging ? 'Drop to upload' : 'or drag & drop here'}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            background: isExporting ? '#0E7490' : 'linear-gradient(135deg, #0891B2, #0E7490)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: isExporting ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 16px rgba(6,182,212,0.25)',
            letterSpacing: '0.03em',
          }}
        >
          {isExporting ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
              Exporting…
            </>
          ) : (
            <>
              <span>↓</span>
              Export PNG
            </>
          )}
        </button>
      </div>

      {/* Error messages */}
      {(parseError || exportError) && (
        <div
          className="no-export"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#FCA5A5',
            fontSize: '12px',
            marginBottom: '16px',
          }}
        >
          {parseError || exportError}
        </div>
      )}

      {/* ── Dashboard preview ── */}
      <div
        className="no-export"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 60px rgba(0,0,0,0.6)',
            borderRadius: '12px',
            overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          <Dashboard data={data} theme={theme} />
        </div>
      </div>

<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FFFFFF; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #1E293B; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
}
