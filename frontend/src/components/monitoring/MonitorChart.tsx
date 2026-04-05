import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface MonitorChartProps {
  data: any[];
}

export function MonitorChart({ data }: MonitorChartProps) {
  // Map and sort data for charting
  const chartData = [...data]
    .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
    .map((check) => ({
      time: new Date(check.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: check.response_time_ms,
      isUp: check.is_up ? 1 : 0,
    }));

  if (chartData.length === 0) return <div className="no-chart-data">Not enough data to show chart.</div>;

  return (
    <div className="chart-container">
      <div className="chart-title-row">
        <h3>Response Time (ms)</h3>
      </div>
      <div className="responsive-chart">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              unit="ms"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #1f2937",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#f9fafb" }}
            />
            <Area
              type="monotone"
              dataKey="responseTime"
              stroke="#38bdf8"
              fillOpacity={1}
              fill="url(#colorResponse)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
