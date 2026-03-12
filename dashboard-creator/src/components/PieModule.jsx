import React, { useState, useRef, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const RADIAN = Math.PI / 180;

const CustomTooltip = ({ active, payload, theme }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.payload.fill }} />
        <span style={{ fontWeight: 600 }}>{item.name}</span>
      </div>
      <div style={{ color: theme.textSecondary, marginTop: '2px' }}>
        Value: <span style={{ color: theme.accent1, fontWeight: 700 }}>{item.value}</span>
        <span style={{ marginLeft: '8px' }}>({(item.payload.percent * 100).toFixed(1)}%)</span>
      </div>
    </div>
  );
};

export default function PieModule({ data, theme }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const chartRef = useRef(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setChartSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) return null;

  const pieColors = theme.pieColors || [];
  const total = data.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const chartData = data.map((d, i) => ({
    name: d.category,
    value: d.value ?? 0,
    fill: d.color || pieColors[i % pieColors.length] || theme.accent1,
  }));

  // Compute HTML label positions — same math Recharts uses internally.
  // Recharts Pie default: startAngle=0 (east/3 o'clock), going counter-clockwise.
  // polarToCartesian: x = cx + r*cos(-angle*RADIAN), y = cy + r*sin(-angle*RADIAN)
  const { width, height } = chartSize;
  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const outerR = minDim * 0.5 * 0.85;
  const innerR = minDim * 0.5 * 0.55;
  const labelR = innerR + (outerR - innerR) * 0.55;

  let cumulative = 0;
  const labelPositions = chartData.map((entry) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += entry.value;
    const endAngle = (cumulative / total) * 360;
    const midAngle = (startAngle + endAngle) / 2;
    const x = cx + labelR * Math.cos(-midAngle * RADIAN);
    const y = cy + labelR * Math.sin(-midAngle * RADIAN);
    const percent = entry.value / total;
    return { x, y, percent };
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Module header */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: theme.accent1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Lead Sources
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: theme.textPrimary, marginTop: '2px' }}>
          Pipeline Mix
        </div>
      </div>

      {/* Pie chart — 2/3 of module height */}
      <div ref={chartRef} style={{ flex: '0 0 66%', minHeight: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.fill}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  stroke={activeIndex === index ? 'rgba(255,255,255,0.3)' : 'transparent'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip theme={theme} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* HTML percentage labels — rendered as divs so they export reliably */}
        {width > 0 && labelPositions.map(({ x, y, percent }, i) => {
          if (percent < 0.06) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                fontSize: '9px',
                fontWeight: 700,
                color: '#FFFFFF',
                pointerEvents: 'none',
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              {`${(percent * 100).toFixed(0)}%`}
            </div>
          );
        })}

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary, lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: '9px', color: theme.textSecondary, fontWeight: 500, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '2px 4px',
          alignContent: 'center',
          justifyContent: 'center',
          minHeight: 0,
          paddingTop: '6px',
          borderTop: `1px solid ${theme.borderColor}`,
        }}
      >
        {chartData.map((item, i) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 5px',
                borderRadius: '4px',
                background: activeIndex === i ? `${item.fill}18` : 'transparent',
                cursor: 'default',
                minWidth: 0,
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  background: item.fill,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: theme.textPrimary, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '10px', color: item.fill, fontWeight: 700 }}>{pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
