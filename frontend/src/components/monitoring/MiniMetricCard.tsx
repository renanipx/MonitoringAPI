import React from 'react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Card } from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MiniMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendText?: string;
  chartData?: any[];
  chartDataKey?: string;
  chartColor?: string;
  chartType?: 'line' | 'area';
}

export function MiniMetricCard({
  title,
  value,
  unit,
  icon,
  trendDirection,
  trendValue,
  trendText = "vs last 24h",
  chartData,
  chartDataKey,
  chartColor = "#38bdf8",
  chartType = 'area'
}: MiniMetricCardProps) {

  const getTrendIcon = () => {
    if (trendDirection === 'up') return <ArrowUpRight size={14} />;
    if (trendDirection === 'down') return <ArrowDownRight size={14} />;
    return <Minus size={14} />;
  };

  return (
    <Card className="kpi-card">
      <div className="kpi-header">
        <div className="kpi-label">{title}</div>
        <div className="kpi-icon-wrapper">{icon}</div>
      </div>

      <div className="kpi-info">
        <div className="kpi-value">
          {value}{unit && <span className="kpi-unit">{unit}</span>}
        </div>

        {(trendValue || trendText) && (
          <div className="kpi-trend-row">
            {trendValue && (
              <span className={`kpi-trend ${trendDirection === 'up' ? 'positive' : trendDirection === 'down' ? 'negative' : 'neutral'}`}>
                {getTrendIcon()} {trendValue}
              </span>
            )}
            <span className="kpi-subtext">{trendText}</span>
          </div>
        )}
      </div>

      {chartData && chartData.length > 0 && chartDataKey && (
        <div className="mini-chart">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${chartDataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey={chartDataKey} stroke={chartColor} fillOpacity={1} fill={`url(#gradient-${chartDataKey})`} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <Line type="monotone" dataKey={chartDataKey} stroke={chartColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
