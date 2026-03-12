import React from 'react';

function formatCurrency(val) {
  if (val === null || val === undefined) return '—';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

export default function FunnelChart({ data, theme }) {
  if (!data || data.length === 0) return null;

  const totalStages = data.length;
  const maxWidthPct = 92;
  const minWidthPct = 32;
  const widthStep = (maxWidthPct - minWidthPct) / Math.max(totalStages - 1, 1);

  const funnelColors = theme.funnelColors || [];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Module header */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: theme.accent1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Sales Funnel
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: theme.textPrimary, marginTop: '2px' }}>
          Pipeline Overview
        </div>
      </div>

      {/* Funnel stages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '3px' }}>
        {data.map((stage, i) => {
          const widthPct = maxWidthPct - i * widthStep;
          const color = stage.color || funnelColors[i % funnelColors.length] || theme.accent1;
          const isFirst = i === 0;
          const isLast = i === totalStages - 1;

          // Trapezoid shape using clip-path
          const nextWidthPct = i < totalStages - 1
            ? maxWidthPct - (i + 1) * widthStep
            : widthPct - widthStep;

          const leftOffset = (100 - widthPct) / 2;
          const nextLeftOffset = (100 - nextWidthPct) / 2;

          // Use clip-path polygon for trapezoid
          const clipPath = `polygon(${leftOffset}% 0%, ${100 - leftOffset}% 0%, ${100 - nextLeftOffset}% 100%, ${nextLeftOffset}% 100%)`;

          return (
            <div
              key={i}
              style={{
                position: 'relative',
                height: `${100 / totalStages - 2}%`,
                minHeight: '28px',
              }}
            >
              {/* Trapezoid bar */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: color,
                  clipPath,
                  opacity: 0.9,
                }}
              />
              {/* Subtle gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.12) 100%)',
                  clipPath,
                }}
              />
              {/* Label inside — only if wide enough */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  zIndex: 2,
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '0.03em' }}>
                  {stage.stage}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  {formatCurrency(stage.value)}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>
                  {stage.percentage != null ? `${stage.percentage.toFixed(1)}%` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
        {data.map((stage, i) => {
          const color = stage.color || funnelColors[i % funnelColors.length] || theme.accent1;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
              <span style={{ fontSize: '9px', color: theme.textSecondary, fontWeight: 500 }}>
                {stage.stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
