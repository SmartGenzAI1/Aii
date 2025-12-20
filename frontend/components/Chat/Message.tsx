"use client";

import { useState } from "react";

export function Message({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const [feedback, setFeedback] = useState<null | "up" | "down">(null);

  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold">
        {role === "assistant" ? "GenZ AI" : "You"}
      </div>

      <div className="whitespace-pre-wrap text-sm">
        {content}
      </div>

      {role === "assistant" && (
        <div className="flex gap-2 text-xs text-gray-500">
          <button onClick={() => setFeedback("up")}>
            👍
          </button>
          <button onClick={() => setFeedback("down")}>
            👎
          </button>
        </div>
      )}
    </div>
  );
}
