// ============================================
// FILE: frontend/app/privacy/page.tsx
// Privacy policy
// ============================================

export default function PrivacyPage() {
  return (
    <div className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <h2>Data We Collect</h2>
          <p>
            We collect your email address and chat history to provide our service. 
            We do NOT store your prompts permanently for training.
          </p>

          <h2>How We Use Your Data</h2>
          <ul>
            <li>To provide AI responses via third-party providers</li>
            <li>To track usage and enforce daily quotas</li>
            <li>To prevent abuse and maintain service quality</li>
            <li>To improve our platform (anonymized data only)</li>
          </ul>

          <h2>Third-Party Providers</h2>
          <p>
            Your prompts are sent to Groq, OpenRouter, and HuggingFace to generate responses. 
            Each provider has their own privacy policy.
          </p>

          <h2>Data Retention</h2>
          <ul>
            <li>Chat history: Stored in your browser (localStorage)</li>
            <li>Server logs: Kept for 30 days for debugging</li>
            <li>User account: Deleted upon request</li>
          </ul>

          <h2>Security</h2>
          <p>
            We use industry-standard encryption (HTTPS/TLS) for all communications. 
            API keys are never logged or stored insecurely.
          </p>

          <h2>Contact Us</h2>
          <p>
            Questions about privacy? Email privacy@genzai.app
          </p>
        </div>
      </div>
    </div>
  );
}
