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
    <Card className="kpi-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
      <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div className="kpi-label" style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{title}</div>
        <div className="kpi-icon-wrapper" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>{icon}</div>
      </div>
      
      <div className="kpi-info" style={{ zIndex: 2, marginTop: '0.5rem' }}>
        <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
          {value}{unit && <span style={{fontSize: '1rem', color: '#94a3b8'}}>{unit}</span>}
        </div>
        
        {(trendValue || trendText) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            {trendValue && (
              <span className={`kpi-trend ${trendDirection === 'up' ? 'positive' : trendDirection === 'down' ? 'negative' : 'neutral'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: trendDirection === 'up' ? 'rgba(34,197,94,0.1)' : trendDirection === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)', color: trendDirection === 'up' ? '#4ade80' : trendDirection === 'down' ? '#f87171' : '#94a3b8' }}>
                {getTrendIcon()} {trendValue}
              </span>
            )}
            <span className="kpi-subtext" style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{trendText}</span>
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
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
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
