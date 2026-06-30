import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <header className="relative py-24 md:py-32 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-8 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-300 cursor-default">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Slate 2.0 is now available
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6 max-w-4xl mx-auto transition-colors duration-300">
          Real-time messaging for <br className="hidden md:block"/> modern engineering teams.
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
          Experience ultra-fast, reliable communication powered by WebSockets. Built on an enterprise-grade stack with zero compromises on security or performance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Link to="/signup" className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-300 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Start Chatting for Free <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <a href="#features" className="px-8 py-4 bg-transparent text-zinc-900 dark:text-white font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors duration-300 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Explore Features
          </a>
        </div>
      </div>
    </header>
  );
}
