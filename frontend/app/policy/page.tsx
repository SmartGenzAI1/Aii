// frontend/app/policy/page.tsx

export default function PolicyPage() {
  return (
    <div className="p-4 space-y-4 text-sm">
      <h1 className="text-xl font-semibold">Privacy Policy</h1>

      <p>
        We respect your privacy. We do not sell personal data.
        Messages are processed to provide AI responses and may be
        temporarily logged for abuse prevention.
      </p>

      <h2 className="font-medium">Usage Policy</h2>
      <p>
        Each user is limited to a daily quota to ensure fair use.
        Abuse or automation may result in suspension.
      </p>

      <h2 className="font-medium">Third-Party AI</h2>
      <p>
        Responses are generated using third-party AI providers.
        No provider receives your account credentials.
      </p>
    </div>
  );
}
