import { type AuthResponse, type User } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function coreFetch(path: string, options: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];
const AUTH_PATHS_NO_REFRESH = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response = await coreFetch(path, options);
  if (response.status === 401 && !AUTH_PATHS_NO_REFRESH.has(path)) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await coreFetch("/auth/refresh", { method: "POST" });
        if (!refreshRes.ok) {
          throw new Error("Refresh failed");
        }
        pendingRequests.forEach((resolve) => resolve());
        pendingRequests = [];
      } catch {
        pendingRequests = [];
        throw new Error("Authentication required");
      } finally {
        isRefreshing = false;
      }
    } else {
      await new Promise<void>((resolve) => pendingRequests.push(resolve));
    }
    response = await coreFetch(path, options);
  }

  if (!response.ok) {
    let message = "Unexpected error";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return null as T;
}

export async function register(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function currentUser() {
  return request<{ user: User }>("/auth/me", {
    method: "GET",
  });
}

export async function logout() {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to logout");
  }
}

export async function requestPasswordReset(email: string) {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

// Monitors
export async function createMonitor(name: string, url: string, intervalMinutes: number = 5, webhookUrl?: string, method: string = "GET", expectedStatusCode?: number | null) {
  return request<{ monitor: any }>("/monitors", {
    method: "POST",
    body: JSON.stringify({ name, url, interval_minutes: intervalMinutes, webhook_url: webhookUrl, method, expected_status_code: expectedStatusCode }),
  });
}

export async function updateMonitor(id: string, name: string, url: string, intervalMinutes: number = 5, webhookUrl?: string, method: string = "GET", expectedStatusCode?: number | null) {
  return request<{ monitor: any }>(`/monitors/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, url, interval_minutes: intervalMinutes, webhook_url: webhookUrl, method, expected_status_code: expectedStatusCode }),
  });
}

export async function listMonitors() {
  return request<{ monitors: any[] }>("/monitors", {
    method: "GET",
  });
}

export async function deleteMonitor(id: string) {
  return request<void>(`/monitors/${id}`, {
    method: "DELETE",
  });
}

export async function getMonitorStats(id: string) {
  return request<{ uptime_24h: number; recent_checks: any[]; heatmap?: any[] }>(`/monitors/${id}/stats`, {
    method: "GET",
  });
}

export async function getPublicStatus(token: string) {
  return request<any>(`/public/status/${token}`, {
    method: "GET",
  });
}

// Metrics
export async function getMetricsOverview() {
  return request<any[]>("/metrics/overview", {
    method: "GET",
  });
}

export async function getAggregatedMetrics(monitorId: string, range: '1h' | '24h' | '7d') {
  return request<any[]>(`/metrics/${monitorId}?range=${range}`, {
    method: "GET",
  });
}
