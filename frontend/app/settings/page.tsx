// ============================================
// FILE: frontend/app/settings/page.tsx
// User settings & API configuration
// ============================================

"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { mode, setMode } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSaveKey = () => {
    localStorage.setItem("byo_api_key_openrouter", apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400 mb-12">Customize your GenZ AI experience</p>

        {/* Account Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Account</h2>
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Email</label>
                <p className="text-white font-semibold mt-2">{session?.user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Plan</label>
                <p className="text-white font-semibold mt-2">Pro (50 requests/day)</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Account Created</label>
                <p className="text-white font-semibold mt-2">Recently</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Mode Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">AI Mode</h2>
          
          <div className="space-y-4">
            {/* Platform AI */}
            <div
              onClick={() => setMode("platform")}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                mode === "platform"
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-blue-500/20 bg-slate-900/50 hover:border-blue-400"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full border-2 mt-1" style={{
                  borderColor: mode === "platform" ? "#3b82f6" : "#64748b",
                  background: mode === "platform" ? "#3b82f6" : "transparent"
                }} />
                <div>
                  <h3 className="text-lg font-bold text-white">Platform AI (Recommended)</h3>
                  <p className="text-slate-400 text-sm mt-2">
                    Use our intelligent routing system. We manage API keys securely.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-300">
                    <li>✓ Automatic provider failover</li>
                    <li>✓ Key rotation for better uptime</li>
                    <li>✓ Daily quota management</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bring Your Own Key */}
            <div
              onClick={() => setMode("byo")}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                mode === "byo"
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-blue-500/20 bg-slate-900/50 hover:border-blue-400"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full border-2 mt-1" style={{
                  borderColor: mode === "byo" ? "#3b82f6" : "#64748b",
                  background: mode === "byo" ? "#3b82f6" : "transparent"
                }} />
                <div>
                  <h3 className="text-lg font-bold text-white">Bring Your Own API Key</h3>
                  <p className="text-slate-400 text-sm mt-2">
                    Use your own OpenRouter or Groq API key.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-300">
                    <li>✓ Direct API calls (no backend)</li>
                    <li>✓ No quota limits</li>
                    <li>✓ Full control of costs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* API Key Input (BYO Mode) */}
          {mode === "byo" && (
            <div className="mt-6 p-6 bg-slate-900/50 border border-blue-500/20 rounded-xl">
              <label className="text-sm font-semibold text-white mb-3 block">
                OpenRouter API Key
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-blue-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveKey}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
              {saved && <p className="text-green-400 text-sm mt-3">✓ API key saved securely</p>}
              <p className="text-slate-500 text-xs mt-3">
                Your API key is stored in your browser only and never sent to our servers.
              </p>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-blue-500/20 rounded-lg">
              <div>
                <p className="text-white font-semibold">Dark Mode</p>
                <p className="text-slate-400 text-sm">Always enabled for comfort</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-blue-500/20 rounded-lg">
              <div>
                <p className="text-white font-semibold">Sound Effects</p>
                <p className="text-slate-400 text-sm">Message notification sounds</p>
              </div>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Danger Zone</h2>
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-white font-semibold mb-4">Delete Account</p>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently delete your account and all associated data.
            </p>
            <button className="px-6 py-2 rounded-lg bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30 transition-colors font-semibold">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
