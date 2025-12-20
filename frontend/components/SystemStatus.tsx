"use client";

import { useEffect, useState } from "react";

type Status = "ok" | "degraded" | "down";

export function SystemStatus() {
  const [status, setStatus] = useState<Status>("ok");

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(() => setStatus("down"));
  }, []);

  const color =
    status === "ok"
      ? "bg-green-500"
      : status === "degraded"
      ? "bg-orange-500"
      : "bg-red-500";

  const label =
    status === "ok"
      ? "All systems operational"
      : status === "degraded"
      ? "Partial outage"
      : "Service down";

  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}
