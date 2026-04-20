import { useState, useEffect, useCallback } from "react";
import { getMetricsOverview, listMonitors, getRecentIncidents } from "../services/api";

export function useDashboardData() {
  const [overviewMetrics, setOverviewMetrics] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, monitorsData, incidentsData] = await Promise.all([
        getMetricsOverview(),
        listMonitors(),
        getRecentIncidents()
      ]);
      setOverviewMetrics(overviewData);
      setMonitors(monitorsData.monitors || []);
      setIncidents(incidentsData.incidents || []);
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    overviewMetrics,
    monitors,
    incidents,
    loading,
    refresh: fetchData
  };
}
