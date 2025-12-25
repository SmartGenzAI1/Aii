// ============================================
// FILE: frontend/app/about/page.tsx
// About page with team
// ============================================

"use client";

import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="flex-1">
      {/* About Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-6">About GenZ AI</h1>
        <p className="text-lg text-slate-300 mb-8">
          We're building the fastest, most reliable AI chat platform. GenZ AI intelligently routes 
          your queries across multiple world-class AI providers, ensuring you always get the best response 
          in milliseconds.
        </p>
      </section>

      {/* Team Section */}
      <section id="team" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold mb-12">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Owais Ahmad", role: "Founder & CEO", bio: "AI enthusiast, full-stack engineer" },
            { name: "DevOps Lead", role: "Infrastructure", bio: "Scaling systems at speed" },
            { name: "Design Lead", role: "UX/UI", bio: "Creating beautiful experiences" },
          ].map((member, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">{member.name}</h3>
              <p className="text-blue-400 text-sm mb-2">{member.role}</p>
              <p className="text-slate-400 text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl my-16">
        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
        <p className="text-lg text-slate-300">
          To democratize access to the world's best AI models. We believe everyone deserves fast, 
          reliable, and affordable AI assistance. By intelligently routing requests and maintaining 
          99.8% uptime, we're making that possible.
        </p>
      </section>
    </div>
  );
}
