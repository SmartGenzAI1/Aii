// frontend/components/UsageMeter.tsx

"use client";

type Props = {
  used: number;
  limit: number;
};

export function UsageMeter({ used, limit }: Props) {
  const percent = Math.min((used / limit) * 100, 100);

  return (
    <div>
      <p className="text-sm mb-1">
        Daily Usage: {used} / {limit}
      </p>
      <div className="h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-black rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
