"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          The app is still running, but a feature failed to load.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded bg-black px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
