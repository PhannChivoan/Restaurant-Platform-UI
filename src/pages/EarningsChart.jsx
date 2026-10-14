import { useMemo } from "react";
import { Typography } from "antd";
import { buildEarningsTrend } from "../utils/mapHelpers";

const { Text } = Typography;

const EarningsChart = ({ rows }) => {
  const data = useMemo(() => buildEarningsTrend(rows), [rows]);

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: "24px 16px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 12,
        }}
      >
        No earnings data to chart yet
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.earnings), 1);
  const chartWidth = 280;
  const chartHeight = 80;
  const barWidth = Math.max(6, Math.min(20, chartWidth / data.length - 4));

  return (
    <div style={{ padding: "12px 14px 14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text strong style={{ fontSize: 12, color: "#334155" }}>
          Earnings Trend
        </Text>
        <Text style={{ fontSize: 10, color: "#94a3b8" }}>
          Last {data.length} active days
        </Text>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight + 16}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {data.map((point, index) => {
          const barHeight = (point.earnings / max) * chartHeight;
          const x = index * (chartWidth / data.length) + 2;
          const y = chartHeight - barHeight;

          return (
            <g key={point.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill="#f97316"
                opacity={0.85}
              >
                <title>{`${point.label}: $${point.earnings.toLocaleString()}`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 12}
                textAnchor="middle"
                fontSize={8}
                fill="#94a3b8"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default EarningsChart;