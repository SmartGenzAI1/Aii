"use client";

export function CodeBlock({ code }: { code: string }) {
  function copy() {
    navigator.clipboard.writeText(code);
  }

  return (
    <div className="relative bg-gray-900 text-white rounded p-3 text-xs">
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-xs bg-gray-700 px-2 py-1 rounded"
      >
        Copy
      </button>
      <pre className="overflow-x-auto">{code}</pre>
    </div>
  );
}
