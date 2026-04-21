import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { Card } from '../ui/Card';
import { Activity } from 'lucide-react';
import { useMemo } from 'react';

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
  const aggregateValue = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    // For uptime, we want the global average/latest across the 24h.
    // An average of the averages is a good approximation for a global unified number.
    const validData = data.filter(d => typeof d[dataKey] === 'number');
    if (validData.length === 0) return null;

    const sum = validData.reduce((acc, current) => acc + current[dataKey], 0);
    const avg = sum / validData.length;
    
    // Format elegantly (e.g. 99.98% or 120ms)
    return avg % 1 !== 0 ? Number(avg.toFixed(2)) : avg;
  }, [data, dataKey]);

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
      
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="metric-panel-aggregate" style={{ padding: '0 0 1rem 0', display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
          {aggregateValue !== null ? (
            <>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{aggregateValue}</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>{unit}</span>
            </>
          ) : (
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#64748b' }}>No data available</span>
          )}
        </div>

        <div className="panel-chart-container" style={{ flex: 1, minHeight: '120px' }}>
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
          ) : null}
        </div>
      </div>
    </Card>
  );
}
