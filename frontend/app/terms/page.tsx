// ============================================
// FILE: frontend/app/terms/page.tsx
// Terms of service
// ============================================

export default function TermsPage() {
  return (
    <div className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <h2>1. Acceptable Use</h2>
          <p>
            You agree not to use GenZ AI for illegal activities, harassment, or generating harmful content.
          </p>

          <h2>2. Daily Quotas</h2>
          <p>
            Free users: 50 requests/day. Pro users: 500 requests/day. 
            Quotas reset at midnight UTC.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            Content you generate is yours to use. We don't claim ownership of prompts or responses.
          </p>

          <h2>4. Service Availability</h2>
          <p>
            We provide "as-is" service with 99.8% uptime target. 
            We may experience downtime for maintenance.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            We are not liable for indirect or consequential damages from service use.
          </p>

          <h2>6. Changes to Terms</h2>
          <p>
            We may update these terms. Continued use means you accept new terms.
          </p>
        </div>
      </div>
    </div>
  );
}
