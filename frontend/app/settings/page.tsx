// frontend/app/settings/page.tsx

"use client";

import { useChatStore } from "@/store/chatStore";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const { model, setModel } = useChatStore();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section>
        <h2 className="font-medium">Model Preference</h2>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as any)}
          className="border px-3 py-2 mt-2"
        >
          <option value="fast">Fast</option>
          <option value="balanced">Balanced</option>
          <option value="smart">Smart</option>
        </select>
      </section>

      <section>
        <h2 className="font-medium">Account</h2>
        <button
          onClick={() => signOut()}
          className="mt-2 text-red-600"
        >
          Logout
        </button>
      </section>
    </div>
  );
}
