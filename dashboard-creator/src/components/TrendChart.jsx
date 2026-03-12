import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

function formatM(val) {
  if (val === null || val === undefined) return '';
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

function formatYAxis(val) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

const CustomDot = (props) => {
  const { cx, cy, value, fill } = props;
  if (value === null || value === undefined) return null;
  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />;
};

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload || !payload.length) return null;
  const visible = payload.filter((p) => p.dataKey !== 'bridge');
  if (!visible.length) return null;
  return (
    <div
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '11px',
        color: theme.textPrimary,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '4px', color: theme.accent1 }}>{label}</div>
      {visible.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: '8px' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{formatM(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLabel = (props) => {
  const { x, y, value, theme } = props;
  if (value === null || value === undefined) return null;
  return (
    <text x={x} y={y - 8} fill={theme.textPrimary} fontSize={8} textAnchor="middle" fontWeight={600}>
      {formatM(value)}
    </text>
  );
};

export default function TrendChart({ data, theme }) {
  if (!data || data.length === 0) return null;

  const threshold = data.find((d) => d.threshold != null)?.threshold;
  const hasActual = data.some((d) => d.won_amount != null);
  const hasForecast = data.some((d) => d.forecast != null);

  // Build bridge: dotted connector from last actual point to first forecast point
  const lastActualIdx = data.reduce((last, d, i) => d.won_amount != null ? i : last, -1);
  const firstForecastIdx = data.findIndex((d) => d.forecast != null);
  const chartData = data.map((d, i) => ({
    ...d,
    bridge:
      (lastActualIdx >= 0 && firstForecastIdx >= 0 && i >= lastActualIdx && i <= firstForecastIdx)
        ? (i === lastActualIdx ? d.won_amount : d.forecast)
        : null,
  }));

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Module header */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: theme.accent1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Revenue Trend
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: theme.textPrimary, marginTop: '2px' }}>
          Won vs. Forecast
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 18, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.borderColor} strokeOpacity={0.5} />
            <XAxis
              dataKey="month"
              tick={{ fill: theme.textSecondary, fontSize: 10 }}
              axisLine={{ stroke: theme.borderColor }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: theme.textPrimary, fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip theme={theme} />} />

            {threshold != null && (
              <ReferenceLine
                y={threshold}
                stroke={theme.thresholdColor}
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `Target ${formatM(threshold)}`,
                  position: 'insideTopRight',
                  fill: theme.thresholdColor,
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Bridge: dotted connector between last actual and first forecast */}
            {hasActual && hasForecast && (
              <Line
                type="linear"
                dataKey="bridge"
                stroke={theme.chartLine}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                connectNulls={true}
                legendType="none"
                tooltipType="none"
                isAnimationActive={false}
              />
            )}

            {hasActual && (
              <Line
                type="monotone"
                dataKey="won_amount"
                name="Won"
                stroke={theme.chartLine}
                strokeWidth={2.5}
                dot={<CustomDot fill={theme.chartDot} />}
                connectNulls={false}
                activeDot={{ r: 6, fill: theme.chartLine, stroke: 'white', strokeWidth: 2 }}
              >
                <LabelList content={(props) => <CustomLabel {...props} theme={theme} />} />
              </Line>
            )}

            {hasForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke={theme.accent2}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={<CustomDot fill={theme.accent2} />}
                connectNulls={false}
                activeDot={{ r: 5, fill: theme.accent2, stroke: 'white', strokeWidth: 2 }}
              >
                <LabelList content={(props) => <CustomLabel {...props} theme={theme} />} />
              </Line>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', alignItems: 'center' }}>
        {hasActual && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '18px', height: '2.5px', background: theme.chartLine, borderRadius: '2px' }} />
            <span style={{ fontSize: '9px', color: theme.textSecondary, fontWeight: 600 }}>Won Amount</span>
          </div>
        )}
        {hasForecast && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '18px', height: '2px', background: theme.accent2, borderRadius: '2px', borderTop: `2px dashed ${theme.accent2}` }} />
            <span style={{ fontSize: '9px', color: theme.textSecondary, fontWeight: 600 }}>Forecast</span>
          </div>
        )}
        {threshold != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '18px', height: '1.5px', background: theme.thresholdColor, borderRadius: '2px' }} />
            <span style={{ fontSize: '9px', color: theme.textSecondary, fontWeight: 600 }}>Target</span>
          </div>
        )}
      </div>
    </div>
  );
}
