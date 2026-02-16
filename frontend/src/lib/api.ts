const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export type User = {
  id: string;
  email: string;
  createdAt?: string;
};
export type AuthResponse = {
  user: User;
};

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

  return (await response.json()) as T;
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
