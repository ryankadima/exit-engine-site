import React from 'react';

function formatCurrency(val, compact = true) {
  if (val === null || val === undefined) return '—';
  if (compact) {
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  }
  return `$${val.toLocaleString()}`;
}

function formatPct(val) {
  if (val === null || val === undefined) return '—';
  return `${val.toFixed(1)}%`;
}

function deriveKPIs(funnelData, lineChartData, forecastTable) {
  const totalPipeline = funnelData[0]?.value ?? 0;
  const wonDeals = lineChartData
    .filter((d) => d.won_amount != null)
    .reduce((sum, d) => sum + d.won_amount, 0);

  const latestForecastRow = forecastTable[0] ?? null;
  const expectedRevenue = latestForecastRow?.expected ?? null;
  const pipelineValue = latestForecastRow?.pipeline ?? totalPipeline;

  const topStage = funnelData[0]?.value ?? 0;
  const bottomStage = funnelData[funnelData.length - 1]?.value ?? 0;
  const conversionRate = topStage > 0 ? (bottomStage / topStage) * 100 : 0;

  const dealsInPipeline = forecastTable.reduce((sum, r) => sum + (r.pipeline ?? 0), 0);

  return [
    { label: 'Total Pipeline', value: formatCurrency(totalPipeline), icon: '◈' },
    { label: 'Expected Revenue', value: formatCurrency(expectedRevenue), icon: '◉' },
    { label: 'Won (YTD)', value: formatCurrency(wonDeals), icon: '✓', positive: true },
    { label: 'Pipeline Value', value: formatCurrency(pipelineValue), icon: '⬡' },
    { label: 'Conversion Rate', value: formatPct(conversionRate), icon: '%' },
    { label: 'Deal Count', value: `${forecastTable.length * 12}`, icon: '#' },
  ];
}

export default function KPIBar({ funnelData, lineChartData, forecastTable, theme }) {
  const kpis = deriveKPIs(funnelData, lineChartData, forecastTable);

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '10px',
      }}
    >
      {kpis.map((kpi, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: theme.kpiBg,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Accent left border */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '3px',
              background: i % 2 === 0 ? theme.accent1 : theme.accent2,
              borderRadius: '8px 0 0 8px',
            }}
          />
          <div
            style={{
              fontSize: '10px',
              color: theme.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
              paddingLeft: '4px',
            }}
          >
            {kpi.label}
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: theme.textPrimary,
              lineHeight: 1.2,
              paddingLeft: '4px',
            }}
          >
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  );
}
