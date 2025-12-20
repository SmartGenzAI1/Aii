"use client";

/*
  Message component
  - Shows sender name
  - Supports code blocks with copy
  - Adds feedback buttons for AI
*/

import { useState } from "react";

function extractCodeBlocks(content: string) {
  const regex = /```([\s\S]*?)```/g;
  const parts: { type: "text" | "code"; value: string }[] = [];

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: "code",
      value: match[1].trim(),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return parts;
}

function CodeBlock({ code }: { code: string }) {
  function copy() {
    navigator.clipboard.writeText(code);
  }

  return (
    <div className="relative bg-[#0F0F0F] text-white rounded-lg p-3 text-xs my-2">
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-[11px] bg-gray-700 px-2 py-1 rounded"
      >
        Copy
      </button>
      <pre className="overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

export function Message({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const [feedback, setFeedback] = useState<
    null | "up" | "down"
  >(null);

  const parts = extractCodeBlocks(content);

  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-700">
        {role === "assistant" ? "GenZ AI" : "You"}
      </div>

      <div className="text-sm leading-relaxed space-y-2">
        {parts.map((p, i) =>
          p.type === "code" ? (
            <CodeBlock key={i} code={p.value} />
          ) : (
            <p key={i} className="whitespace-pre-wrap">
              {p.value}
            </p>
          )
        )}
      </div>

      {role === "assistant" && (
        <div className="flex gap-3 text-xs text-gray-500 mt-1">
          <button
            onClick={() => setFeedback("up")}
            className={feedback === "up" ? "text-black" : ""}
          >
            👍
          </button>
          <button
            onClick={() => setFeedback("down")}
            className={feedback === "down" ? "text-black" : ""}
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
}
