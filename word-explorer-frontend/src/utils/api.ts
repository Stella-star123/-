import { useUserStore } from "../store/useUserStore";

const BASE_URL = "/api";

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useUserStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "请求失败");
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
