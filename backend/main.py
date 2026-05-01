import asyncio
import time
from collections import Counter
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

CHECK_INTERVAL_SECONDS = 6
REQUEST_TIMEOUT_SECONDS = 5
RETRY_ATTEMPTS = 2


class AddUrlRequest(BaseModel):
    url: HttpUrl


class MonitorLog(BaseModel):
    url: str
    status_code: Optional[int]
    response_time_ms: float
    timestamp: str
    success: bool
    error: Optional[str] = None


class MonitorStore:
    def __init__(self) -> None:
        self.urls: list[str] = []
        self.logs: list[dict[str, Any]] = []
        self._lock = Lock()

    def add_url(self, url: str) -> None:
        with self._lock:
            if url not in self.urls:
                self.urls.append(url)

    def get_urls(self) -> list[str]:
        with self._lock:
            return list(self.urls)

    def add_log(self, log: dict[str, Any]) -> None:
        with self._lock:
            self.logs.append(log)
            # Keep memory bounded to latest 10k entries.
            if len(self.logs) > 10_000:
                self.logs = self.logs[-10_000:]

    def get_logs(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(self.logs)


app = FastAPI(title="NetPulse API", version="1.0.0")
store = MonitorStore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def perform_check(url: str) -> dict[str, Any]:
    last_error = None
    for _ in range(RETRY_ATTEMPTS):
        start = time.perf_counter()
        try:
            response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "url": url,
                "status_code": response.status_code,
                "response_time_ms": latency_ms,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "success": 200 <= response.status_code < 400,
                "error": None,
            }
        except requests.RequestException as exc:
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            last_error = str(exc)
            failed_log = {
                "url": url,
                "status_code": None,
                "response_time_ms": latency_ms,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "success": False,
                "error": last_error,
            }
    return failed_log


async def check_all_urls() -> list[dict[str, Any]]:
    urls = store.get_urls()
    if not urls:
        return []

    loop = asyncio.get_running_loop()
    tasks = [loop.run_in_executor(None, perform_check, url) for url in urls]
    results = await asyncio.gather(*tasks)

    for result in results:
        store.add_log(result)

    return results


async def scheduler_loop() -> None:
    while True:
        await check_all_urls()
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


@app.on_event("startup")
async def startup_event() -> None:
    app.state.scheduler_task = asyncio.create_task(scheduler_loop())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    task = getattr(app.state, "scheduler_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


@app.post("/add-url")
def add_url(payload: AddUrlRequest) -> dict[str, str]:
    normalized_url = str(payload.url)
    if normalized_url in store.get_urls():
        raise HTTPException(status_code=409, detail="URL is already being monitored")
    store.add_url(normalized_url)
    return {"message": "URL added successfully", "url": normalized_url}


@app.get("/urls")
def get_urls() -> dict[str, list[str]]:
    return {"urls": store.get_urls()}


@app.get("/check")
async def trigger_check() -> dict[str, Any]:
    results = await check_all_urls()
    return {"checked": len(results), "results": results}


@app.get("/logs", response_model=list[MonitorLog])
def get_logs() -> list[dict[str, Any]]:
    return store.get_logs()


@app.get("/metrics")
def get_metrics() -> dict[str, Any]:
    logs = store.get_logs()

    if not logs:
        return {
            "uptime_percentage": 0.0,
            "average_latency_ms": 0.0,
            "total_requests": 0,
            "error_rate": 0.0,
            "status_code_distribution": {},
            "per_url": {},
        }

    total = len(logs)
    success_count = sum(1 for log in logs if log["success"])
    error_count = total - success_count

    latencies = [log["response_time_ms"] for log in logs]
    average_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0

    status_codes = Counter(
        str(log["status_code"]) for log in logs if log["status_code"] is not None
    )

    per_url: dict[str, dict[str, Any]] = {}
    for url in store.get_urls():
        url_logs = [log for log in logs if log["url"] == url]
        if not url_logs:
            per_url[url] = {
                "uptime_percentage": 0.0,
                "average_latency_ms": 0.0,
                "total_requests": 0,
                "error_rate": 0.0,
            }
            continue

        url_total = len(url_logs)
        url_success = sum(1 for log in url_logs if log["success"])
        url_avg_latency = round(
            sum(log["response_time_ms"] for log in url_logs) / url_total, 2
        )
        per_url[url] = {
            "uptime_percentage": round((url_success / url_total) * 100, 2),
            "average_latency_ms": url_avg_latency,
            "total_requests": url_total,
            "error_rate": round(((url_total - url_success) / url_total) * 100, 2),
        }

    return {
        "uptime_percentage": round((success_count / total) * 100, 2),
        "average_latency_ms": average_latency,
        "total_requests": total,
        "error_rate": round((error_count / total) * 100, 2),
        "status_code_distribution": dict(status_codes),
        "per_url": per_url,
    }
