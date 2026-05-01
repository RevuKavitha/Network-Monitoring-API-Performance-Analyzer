import { Metrics, MonitorLog } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export async function addUrl(url: string): Promise<void> {
  const response = await fetch(`${API_BASE}/add-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Failed to add URL");
  }
}

export async function getUrls(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/urls`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch URLs");
  const data = await response.json();
  return data.urls ?? [];
}

export async function getLogs(): Promise<MonitorLog[]> {
  const response = await fetch(`${API_BASE}/logs`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch logs");
  return response.json();
}

export async function getMetrics(): Promise<Metrics> {
  const response = await fetch(`${API_BASE}/metrics`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch metrics");
  return response.json();
}
