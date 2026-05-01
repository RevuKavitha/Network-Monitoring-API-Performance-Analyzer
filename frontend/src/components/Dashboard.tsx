"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addUrl, getLogs, getMetrics, getUrls } from "@/lib/api";
import { Metrics, MonitorLog } from "@/lib/types";

const EMPTY_METRICS: Metrics = {
  uptime_percentage: 0,
  average_latency_ms: 0,
  total_requests: 0,
  error_rate: 0,
  status_code_distribution: {},
  per_url: {},
};

export default function Dashboard() {
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [urlList, logList, metricData] = await Promise.all([
        getUrls(),
        getLogs(),
        getMetrics(),
      ]);
      setUrls(urlList);
      setLogs(logList);
      setMetrics(metricData);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, []);

  const submitUrl = async (event: FormEvent) => {
    event.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    try {
      await addUrl(urlInput.trim());
      setUrlInput("");
      await fetchAll();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const latencySeries = useMemo(() => {
    return logs.slice(-30).map((log) => ({
      timestamp: new Date(log.timestamp).toLocaleTimeString(),
      latency: log.response_time_ms,
      url: log.url,
    }));
  }, [logs]);

  const statusCodeSeries = useMemo(() => {
    return Object.entries(metrics.status_code_distribution).map(([code, count]) => ({
      code,
      count,
    }));
  }, [metrics.status_code_distribution]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">NetPulse Dashboard</h1>
        <p className="text-slate-600">Real-time network monitoring and API performance analytics</p>
      </div>

      <section className="mb-6 rounded-xl bg-brand-panel p-4 shadow-sm">
        <form onSubmit={submitUrl} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            placeholder="https://api.example.com/health"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 outline-none ring-brand-accent focus:ring"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-accent px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add URL"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-brand-bad">{error}</p>}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Monitored URLs" value={urls.length.toString()} />
        <MetricCard title="Uptime" value={`${metrics.uptime_percentage}%`} />
        <MetricCard title="Avg Latency" value={`${metrics.average_latency_ms} ms`} />
        <MetricCard title="Error Rate" value={`${metrics.error_rate}%`} />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-brand-panel p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Latency Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" minTickGap={30} />
                <YAxis unit="ms" />
                <Tooltip />
                <Line type="monotone" dataKey="latency" stroke="#0f766e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-brand-panel p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Status Code Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCodeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0369a1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-brand-panel p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Request Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-3 py-2">URL</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice().reverse().slice(0, 100).map((log, idx) => (
                <tr key={`${log.url}-${log.timestamp}-${idx}`} className="border-b border-slate-100">
                  <td className="px-3 py-2">{log.url}</td>
                  <td className="px-3 py-2">{log.status_code ?? "N/A"}</td>
                  <td className="px-3 py-2">{log.response_time_ms} ms</td>
                  <td className="px-3 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className={`px-3 py-2 font-semibold ${log.success ? "text-brand-ok" : "text-brand-bad"}`}>
                    {log.success ? "Success" : "Failed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-panel p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
