// frontend/app/settings/page.tsx

"use client";

import { useSettingsStore } from "@/store/settingsStore";
import { saveApiKey } from "@/lib/localKeys";

export default function SettingsPage() {
  const { mode, setMode } = useSettingsStore();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section>
        <h2 className="font-medium">AI Mode</h2>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="border px-3 py-2 mt-2"
        >
          <option value="platform">Platform AI (recommended)</option>
          <option value="byo">Use My Own API Key</option>
        </select>
      </section>
      <section>
  <h2 className="font-medium">Upcoming Features</h2>

  <ul className="text-sm text-gray-600 space-y-1 mt-2">
    <li>🖼️ Image Generation — Coming Soon</li>
    <li>🎤 Voice Input & Output — Coming Soon</li>
  </ul>
</section>
      {mode === "byo" && (
        <section className="space-y-2">
          <p className="text-sm text-gray-600">
            Your API key is stored locally and never sent to our servers.
          </p>

          <input
            type="password"
            placeholder="Paste your Groq / OpenRouter key"
            className="border px-3 py-2 w-full"
            onChange={(e) => saveApiKey("openrouter", e.target.value)}
          />
        </section>
      )}
    </div>
  );
}
