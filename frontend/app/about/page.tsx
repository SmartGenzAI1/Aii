// frontend/app/about/page.tsx

export default function AboutPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">About</h1>

      <p>
        YourAI is built to provide fast, accessible, and secure AI
        assistance for everyone.
      </p>

      <h2 className="font-medium">Team</h2>
      <p>
        Built by independent developers focused on quality,
        transparency, and user experience.
      </p>

      <h2 className="font-medium">Contact</h2>
      <ul className="list-disc ml-6">
        <li>Twitter / X</li>
        <li>GitHub</li>
        <li>Discord (optional)</li>
      </ul>
    </div>
  );
}
