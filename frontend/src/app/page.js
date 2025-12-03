'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Floating Orbs Background
const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl absolute -top-48 -left-48 animate-float"></div>
    <div className="w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl absolute top-1/3 -right-40 animate-float-delayed"></div>
    <div className="w-64 h-64 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-full blur-3xl absolute bottom-20 left-1/4 animate-float"></div>
    <div className="w-72 h-72 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-3xl absolute top-1/2 left-1/2 animate-float-delayed"></div>
  </div>
);

// Feature Card
const FeatureCard = ({ icon, title, description, gradient }) => (
  <div className="glass rounded-2xl p-6 card-hover group">
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingOrbs />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="glass border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <span className="text-xl">✨</span>
              </div>
              <span className="text-xl font-bold text-white">PrimeTrade</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary px-4 py-2">
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm text-gray-300">Productivity Reimagined</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Manage Tasks with
              <span className="text-gradient block">Stunning Clarity</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              A powerful task management dashboard with real-time analytics, 
              smart insights, and a beautiful interface designed for productivity.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup" className="btn-primary px-8 py-4 text-lg font-semibold inline-flex items-center justify-center gap-2">
                Start Free Today
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/login" className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon="📋"
                title="Smart Task Management"
                description="Create, organize, and track tasks with priorities, due dates, and status updates."
                gradient="from-purple-500 to-pink-500"
              />
              <FeatureCard
                icon="📊"
                title="Real-time Analytics"
                description="Beautiful charts and metrics showing your productivity trends and progress."
                gradient="from-cyan-500 to-blue-500"
              />
              <FeatureCard
                icon="💡"
                title="AI-Powered Insights"
                description="Smart suggestions and insights to help you stay on track and improve."
                gradient="from-emerald-500 to-teal-500"
              />
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-4xl font-bold text-gradient">10x</p>
                <p className="text-gray-400 text-sm mt-1">Faster Workflow</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gradient">99%</p>
                <p className="text-gray-400 text-sm mt-1">User Satisfaction</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gradient">24/7</p>
                <p className="text-gray-400 text-sm mt-1">Always Available</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="glass border-t border-white/10 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2024 PrimeTrade. Built with 💜 for productivity enthusiasts.
          </p>
        </footer>
      </div>
    </div>
  );
}
