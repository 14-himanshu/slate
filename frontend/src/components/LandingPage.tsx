import React, { Suspense, useEffect } from 'react';
import Navbar from './landing/Navbar';
import HeroSection from './landing/HeroSection';
import FeatureGrid from './landing/FeatureGrid';
import Footer from './landing/Footer';
import StatsSection from './landing/StatsSection';
import HowItWorksSection from './landing/HowItWorksSection';
import TestimonialsSection from './landing/TestimonialsSection';
import FAQSection from './landing/FAQSection';
import CTASection from './landing/CTASection';

const ChatMockup = React.lazy(() => import('./landing/ChatMockup'));

export default function LandingPage() {
  // Hide the page-level scrollbar while on the landing page
  useEffect(() => {
    document.documentElement.classList.add('no-scrollbar');
    return () => {
      document.documentElement.classList.remove('no-scrollbar');
    };
  }, []);

  return (
    <div className="landing-page min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-300">
      <Navbar />
      <HeroSection />
      
      <StatsSection />
      
      {/* ─── Interactive Chat UI Mockup ─── */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <Suspense fallback={<div className="h-[500px] w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 animate-pulse border border-zinc-200 dark:border-zinc-800" />}>
          <ChatMockup />
        </Suspense>
      </section>

      <TestimonialsSection />
      
      <HowItWorksSection />
      <FeatureGrid />

      <FAQSection />
      <CTASection />
      
      <Footer />
    </div>
  );
}
