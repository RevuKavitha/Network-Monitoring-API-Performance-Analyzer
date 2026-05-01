export type MonitorLog = {
  url: string;
  status_code: number | null;
  response_time_ms: number;
  timestamp: string;
  success: boolean;
  error?: string | null;
};

export type Metrics = {
  uptime_percentage: number;
  average_latency_ms: number;
  total_requests: number;
  error_rate: number;
  status_code_distribution: Record<string, number>;
  per_url: Record<
    string,
    {
      uptime_percentage: number;
      average_latency_ms: number;
      total_requests: number;
      error_rate: number;
    }
  >;
};
