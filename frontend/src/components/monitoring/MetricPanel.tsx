import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { Card } from '../ui/Card';
import { Activity } from 'lucide-react';

interface MetricPanelProps {
  title: string;
  data: any[];
  dataKey: string;
  color?: string;
  type?: 'line' | 'area';
  unit?: string;
  loading?: boolean;
}

export function MetricPanel({ title, data, dataKey, color = "#38bdf8", type = 'area', unit = "", loading = false }: MetricPanelProps) {
  if (loading) {
    return (
      <Card className="metric-panel loading">
        <div className="skeleton-header"></div>
        <div className="skeleton-chart"></div>
      </Card>
    );
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Card className="metric-panel">
      <div className="panel-header">
        <Activity size={16} className="panel-icon" style={{ color }} />
        <h3>{title}</h3>
      </div>
      <div className="panel-chart-container">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tickFormatter={formatXAxis} stroke="#475569" fontSize={10} tickMargin={10} minTickGap={30} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  labelFormatter={(l) => new Date(l).toLocaleString()}
                  formatter={(val: number) => [`${val}${unit}`, dataKey]}
                />
                <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color-${dataKey})`} strokeWidth={2} />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tickFormatter={formatXAxis} stroke="#475569" fontSize={10} tickMargin={10} minTickGap={30} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  labelFormatter={(l) => new Date(l).toLocaleString()}
                  formatter={(val: number) => [`${val}${unit}`, dataKey]}
                />
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="empty-panel">No data available</div>
        )}
      </div>
    </Card>
  );
}
