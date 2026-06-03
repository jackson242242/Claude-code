"""Lightweight in-process metrics for observability."""
from __future__ import annotations

import threading
from collections import defaultdict


class Metrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._requests: defaultdict[str, int] = defaultdict(int)
        self._statuses: defaultdict[str, int] = defaultdict(int)

    def record(self, method: str, path: str, status_code: int) -> None:
        with self._lock:
            self._requests[f"{method} {path}"] += 1
            self._statuses[str(status_code)] += 1

    def snapshot(self) -> dict[str, object]:
        with self._lock:
            return {
                "totalRequests": sum(self._requests.values()),
                "byRoute": dict(self._requests),
                "byStatus": dict(self._statuses),
            }


metrics = Metrics()
