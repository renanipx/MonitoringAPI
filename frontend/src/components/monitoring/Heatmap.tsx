import "../../styles/Heatmap.css";

interface HeatmapProps {
  data?: { day: string; uptime_percentage: number | null }[];
}

export function Heatmap({ data = [] }: HeatmapProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="heatmap-container">
      <div className="heatmap-blocks">
        {data.map((dayData, index) => {
          let statusClass = "block-nodata";
          let tooltipText = "No data";
          
          if (dayData.uptime_percentage !== null) {
            if (dayData.uptime_percentage >= 99) {
              statusClass = "block-good";
              tooltipText = `100% Uptime`;
            } else if (dayData.uptime_percentage >= 90) {
              statusClass = "block-warning";
              tooltipText = `${dayData.uptime_percentage.toFixed(2)}% Uptime`;
            } else {
              statusClass = "block-down";
              tooltipText = `${dayData.uptime_percentage.toFixed(2)}% Uptime`;
            }
          }

          const dateStr = new Date(dayData.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

          return (
            <div 
              key={dayData.day || index} 
              className={`heatmap-block ${statusClass}`}
              title={`${dateStr}: ${tooltipText}`}
            />
          );
        })}
      </div>
      <div className="heatmap-legend">
        <span>30 days ago</span>
        <div style={{ flex: 1, borderBottom: "1px solid #333", margin: "0 10px", transform: "translateY(-50%)" }} />
        <span>Today</span>
      </div>
    </div>
  );
}
