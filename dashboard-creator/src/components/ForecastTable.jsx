import React from 'react';

function formatCurrency(val) {
  if (val === null || val === undefined) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function confidenceColor(pct, theme) {
  if (pct === null || pct === undefined) return theme.textSecondary;
  if (pct >= 70) return '#22C55E';
  if (pct >= 40) return '#FBBF24';
  return '#F87171';
}

function confidenceBg(pct) {
  if (pct === null || pct === undefined) return 'transparent';
  if (pct >= 70) return 'rgba(34,197,94,0.12)';
  if (pct >= 40) return 'rgba(251,191,36,0.12)';
  return 'rgba(248,113,113,0.12)';
}

function ConfidenceBar({ pct, theme }) {
  if (pct === null || pct === undefined) return <span style={{ color: theme.textSecondary }}>—</span>;
  const color = confidenceColor(pct, theme);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          flex: 1,
          height: '5px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            background: color,
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 700, color, minWidth: '28px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function ForecastTable({ data, theme }) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Module header */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: theme.accent1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Quarterly Forecast
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: theme.textPrimary, marginTop: '2px' }}>
          Pipeline & Expected
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.1fr 1.1fr 1.4fr',
            gap: '2px',
            marginBottom: '4px',
          }}
        >
          {['Period', 'Pipeline', 'Expected', 'Confidence'].map((col) => (
            <div
              key={col}
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: theme.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                padding: '0 6px',
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Data rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {data.map((row, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.1fr 1.1fr 1.4fr',
                  gap: '2px',
                  background: isEven ? 'rgba(255,255,255,0.03)' : 'transparent',
                  borderRadius: '5px',
                  padding: '6px 6px',
                  border: `1px solid ${isEven ? theme.borderColor : 'transparent'}`,
                  alignItems: 'center',
                }}
              >
                {/* Period */}
                <div style={{ fontSize: '11px', fontWeight: 700, color: theme.textPrimary }}>
                  {row.period}
                </div>

                {/* Pipeline */}
                <div style={{ fontSize: '11px', color: theme.textSecondary, fontWeight: 500 }}>
                  {formatCurrency(row.pipeline)}
                </div>

                {/* Expected */}
                <div style={{ fontSize: '11px', fontWeight: 700, color: theme.accent1 }}>
                  {formatCurrency(row.expected)}
                </div>

                {/* Confidence */}
                <ConfidenceBar pct={row.confidence} theme={theme} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary row */}
      <div
        style={{
          marginTop: '8px',
          padding: '6px 8px',
          background: `${theme.accent1}14`,
          border: `1px solid ${theme.accent1}40`,
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Total Pipeline
        </span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: theme.accent1 }}>
          {formatCurrency(data.reduce((sum, r) => sum + (r.pipeline ?? 0), 0))}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Expected
        </span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#22C55E' }}>
          {formatCurrency(data.reduce((sum, r) => sum + (r.expected ?? 0), 0))}
        </span>
      </div>
    </div>
  );
}
